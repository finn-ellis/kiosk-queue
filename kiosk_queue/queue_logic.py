from flask import current_app
from .models import User, Queue, LineStatus
import time
from .db import db

def get_public_queue():
    users = User.query.order_by(User.line_number, User.place_in_queue).all()
    first_in_line_ids = set()
    seen_lines = set()
    for u in users:
        if u.line_number not in seen_lines:
            first_in_line_ids.add(u.id)
            seen_lines.add(u.line_number)
    user_list = []
    for user in users:
        entry = {
            'id': user.id,
            'party_size': user.party_size,
            'place_in_queue': user.place_in_queue,
            'line_number': user.line_number,
            'name': user.name
        }
        # if user.id in first_in_line_ids:
        #     entry['name'] = user.name
        user_list.append(entry)
    return user_list

def get_admin_queue_data():
    users = User.query.order_by(User.line_number, User.place_in_queue).all()
    return [{'id': user.id, 'name': user.name, 'email': user.email, 'party_size': user.party_size, 'place_in_queue': user.place_in_queue, 'line_number': user.line_number} for user in users]

def _ensure_line_status():
    line_count = current_app.config['LINE_COUNT']
    existing = {ls.line_number: ls for ls in LineStatus.query.all()}
    changed = False
    for i in range(line_count):
        if i not in existing:
            db.session.add(LineStatus(line_number=i, last_admitted_time=int(time.time())))  # type: ignore[arg-type]
            changed = True
    if changed:
        db.session.commit()

def _compute_wait_times():
    """Compute dynamic wait estimates:
    Returns dict with:
      per_line_single: wait time (minutes) if a size-1 party joined each line now
      per_span: mapping span_size -> estimated wait (minutes) for a new party spanning that many lines placed at optimal start.
    Formula per line slot depth k: last_admitted_time[line] + k*(SLOT_TIME+RESET_TIME).
    For spanning size S we find minimal max over S contiguous lines at their next slot depth.
    """
    _ensure_line_status()
    slot_time = current_app.config['SLOT_TIME']
    reset_time = current_app.config['RESET_TIME']
    line_count = current_app.config['LINE_COUNT']
    span_total = slot_time + reset_time
    # Build occupancy sets of depths per line to capture holes (e.g., depth 1 free while depth 2 occupied by spanning party)
    occupancy = [set() for _ in range(line_count)]
    for u in User.query.order_by(User.place_in_queue).all():
        if u.line_number is None:
            continue
        for ln in range(u.line_number, min(line_count, u.line_number + u.party_size)):
            occupancy[ln].add(u.place_in_queue)
    statuses = {ls.line_number: ls for ls in LineStatus.query.all()}
    now = int(time.time())
    def earliest_free_depth(line):
        depth = 1
        occ = occupancy[line]
        while depth in occ:
            depth += 1
        return depth

    per_line_single = []
    for ln in range(line_count):
        ls = statuses.get(ln)
        last_time = ls.last_admitted_time if ls else now
        depth = earliest_free_depth(ln)
        wait_seconds = last_time + depth * span_total * 60 - now
        per_line_single.append(max(0, wait_seconds // 60))
    per_span = {}
    for span in range(2, line_count+1):
        best_projected = None
        for start in range(0, line_count - span + 1):
            # Find earliest depth simultaneously free across span contiguous lines
            depth = 1
            # Upper bound for search: current max depth observed + span (avoid infinite loop); derive rough cap
            depth_cap = 1
            for ln in range(start, start+span):
                if occupancy[ln]:
                    depth_cap = max(depth_cap, max(occupancy[ln]) + span + 5)
            while True:
                if all(depth not in occupancy[ln] for ln in range(start, start+span)):
                    break
                depth += 1
                if depth > depth_cap:  # safety guard
                    break
            # If depth exceeded cap, skip this start
            if depth > depth_cap:
                continue
            # Compute projected readiness as max across involved lines at that depth
            line_times = []
            for ln in range(start, start+span):
                lt = statuses[ln].last_admitted_time if ln in statuses else now
                line_times.append(lt + depth * span_total * 60)
            projected = max(line_times)
            if best_projected is None or projected < best_projected:
                best_projected = projected
        if best_projected is not None:
            per_span[span] = max(0, (best_projected - now)//60)
    return {
        'per_line_single': per_line_single,
        'per_span': per_span
    }

def broadcast_queue_update():
    socketio = current_app.extensions.get('socketio')
    if not socketio:
        return
    queue = Queue.query.first()
    wait_time = queue.wait_time if queue else 0
    wait_detail = _compute_wait_times()

    # Broadcast separately to admin and public rooms inside /queue namespace
    admin_user_list = get_admin_queue_data()
    socketio.emit('queue_update', {'queue': admin_user_list, 'wait_time': wait_time, 'wait_detail': wait_detail}, to='admin', namespace='/queue')

    public_user_list = get_public_queue()
    socketio.emit('queue_update', {'queue': public_user_list, 'wait_time': wait_time, 'wait_detail': wait_detail}, to='public', namespace='/queue')

def _build_occupancy():
    """Return a list of sets. occupancy[line] = set of depth rows occupied in that line.
    A user spans party_size lines starting at user.line_number. We mark each covered line for the user's depth (place_in_queue)."""
    line_count = current_app.config['LINE_COUNT']
    occupancy = [set() for _ in range(line_count)]
    for u in User.query.all():
        if u.line_number is None:
            continue
        for ln in range(u.line_number, min(line_count, u.line_number + u.party_size)):
            occupancy[ln].add(u.place_in_queue)
    return occupancy

def _find_position(party_size, requested_line=None):
    """Determine starting line (for party) and depth (place_in_queue) according to new rules.
    Rules:
    - Party size 1: if requested_line provided, put in earliest free depth in that line; else choose line whose earliest free depth is minimal (tie -> lowest line index).
    - Party size >1: find contiguous block of lines of width party_size whose earliest common free depth (simultaneously free in every line) is minimal (tie -> lowest starting line).
    Returns (line_number, depth) or (-1,-1) if impossible (shouldn't happen with infinite depth model).
    """
    line_count = current_app.config['LINE_COUNT']
    occupancy = _build_occupancy()

    # Helper to find earliest free depth in a given line
    def earliest_free_depth(line):
        depth = 1
        occ = occupancy[line]
        while depth in occ:
            depth += 1
        return depth

    if party_size <= 1:
        if requested_line is not None:
            if not 0 <= requested_line < line_count:
                return -1, -1
            return requested_line, earliest_free_depth(requested_line)
        # compute earliest depth per line, choose best
        best_line = -1
        best_depth = None
        for ln in range(line_count):
            d = earliest_free_depth(ln)
            if best_depth is None or d < best_depth or (d == best_depth and (best_line == -1 or ln < best_line)):
                best_line = ln
                best_depth = d
        return best_line if best_line != -1 else -1, best_depth if best_depth is not None else -1

    # Multi-line spanning parties
    if party_size > line_count:
        return -1, -1  # cannot span more lines than exist

    best_start = -1
    best_depth = None
    for start in range(0, line_count - party_size + 1):
        depth = 1
        while True:
            # Check if depth free across all lines in span
            if all(depth not in occupancy[ln] for ln in range(start, start + party_size)):
                if best_depth is None or depth < best_depth or (depth == best_depth and (best_start == -1 or start < best_start)):
                    best_start = start
                    best_depth = depth
                break
            depth += 1
            # Safety cap (unlikely to hit); stop after large iterations to avoid infinite loop
            if depth > 10000:
                break
    if best_start == -1 or best_depth is None:
        return -1, -1
    return best_start, best_depth

def _compact_queue(start_depth: int):
    """Compact queue depths upward starting from start_depth to remove holes while preserving relative order constraints.
    A user can move up one depth level if all lines it spans are free at the target depth.
    Repeat until no moves occur. """
    line_count = current_app.config['LINE_COUNT']
    while True:
        # Rebuild occupancy for current state each pass while allowing in-place moves this pass.
        occupancy = [set() for _ in range(line_count)]
        users = User.query.order_by(User.place_in_queue, User.line_number).all()
        moved = False
        for u in users:
            if u.line_number is None:
                continue
            if u.place_in_queue <= start_depth:
                for ln in range(u.line_number, min(line_count, u.line_number + u.party_size)):
                    occupancy[ln].add(u.place_in_queue)
                continue
            target_depth = u.place_in_queue - 1
            if target_depth < start_depth:
                # shouldn't move above start_depth scope
                for ln in range(u.line_number, min(line_count, u.line_number + u.party_size)):
                    occupancy[ln].add(u.place_in_queue)
                continue
            can_move = True
            for ln in range(u.line_number, min(line_count, u.line_number + u.party_size)):
                if target_depth in occupancy[ln]:
                    can_move = False
                    break
            if can_move:
                u.place_in_queue = target_depth
                moved = True
                for ln in range(u.line_number, min(line_count, u.line_number + u.party_size)):
                    occupancy[ln].add(target_depth)
            else:
                for ln in range(u.line_number, min(line_count, u.line_number + u.party_size)):
                    occupancy[ln].add(u.place_in_queue)
        if not moved:
            break
    db.session.flush()

def join_queue_logic(name, email, party_size, line_number_req, email_consent):
    if not name:
        return {'error': 'Name is required'}, 400

    line_number, depth = _find_position(party_size, line_number_req)
    if line_number == -1 or depth == -1:
        return {'error': 'No available space in the queue for this party size.'}, 400

    queue = Queue.query.first()
    if not queue:
        queue = Queue()
        db.session.add(queue)
        db.session.commit()

    # SQLAlchemy model accepts kwargs; type: ignore for static checker
    print(email, email_consent)
    new_user = User(name=name, email=email, party_size=party_size, line_number=line_number, place_in_queue=depth, email_consent=email_consent)  # type: ignore[arg-type]
    db.session.add(new_user)
    # queue.update_wait_time()
    db.session.commit()

    broadcast_queue_update()

    return {'message': 'Successfully joined queue', 'place_in_queue': depth, 'line_number': line_number, 'wait_time': queue.wait_time}, 201

def next_in_queue_logic(line_number):
    if line_number is None:
        return {'error': 'Line number is required'}, 400

    # Find earliest (smallest depth) user whose span covers the line
    users = User.query.order_by(User.place_in_queue, User.line_number).all()
    target = None
    for u in users:
        if u.line_number is None:
            continue
        if u.line_number <= line_number < u.line_number + u.party_size:
            target = u
            break

    if target:
        removed_depth = target.place_in_queue
        db.session.delete(target)
        _compact_queue(removed_depth)
        # Update last admitted time for each line spanned
        _ensure_line_status()
        statuses = {ls.line_number: ls for ls in LineStatus.query.all()}
        now = int(time.time())
        for ln in range(target.line_number, target.line_number + target.party_size):
            if ln in statuses:
                statuses[ln].last_admitted_time = now
        queue = Queue.query.first()
        # if queue:
        #     queue.update_wait_time()
        db.session.commit()
        broadcast_queue_update()
        file_server = current_app.extensions.get('file_server')
        if file_server:
            file_server.log_recent_email(target.email, target.email_consent)
    return {'message': f'Line {line_number} advanced'}

def remove_from_queue_logic(user_id):
    user = User.query.get(user_id)
    if user:
        removed_depth = user.place_in_queue
        db.session.delete(user)
        # Compact queue first to close gaps created by removal
        _compact_queue(removed_depth)
        # Only update last_admitted_time if the removed user was actually the next to be served (depth 1)
        if removed_depth == 1:
            _ensure_line_status()
            statuses = {ls.line_number: ls for ls in LineStatus.query.all()}
            now = int(time.time())
            for ln in range(user.line_number, user.line_number + user.party_size):
                if ln in statuses:
                    statuses[ln].last_admitted_time = now
        queue = Queue.query.first()
        # if queue:
        #     queue.update_wait_time()
        db.session.commit()
        broadcast_queue_update()
        # file_server = current_app.extensions.get('file_server')
        # if file_server:
        #     file_server.log_recent_email(user.email, user.email_consent)
    return {'message': 'User removed'}