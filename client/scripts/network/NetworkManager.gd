extends Node
## Autoload Network Manager untuk Koneksi WebSocket Game Server 3D.
## Menangani status koneksi, serialisasi paket Vector3 C2S/S2C, entity sync, dan auto-reconnect.

signal connection_status_changed(new_status: String)
signal player_authenticated(player_id: String)
signal entity_spawned(entity_id: String, entity_data: Dictionary)
signal entity_despawned(entity_id: String)
signal world_state_received(entities: Array)
signal player_attacked(attacker_id: String, weapon_id: String, facing_yaw: float)
signal player_equipment_updated(entity_id: String, weapon_id: String, armor_id: String)

enum ConnectionState {
	DISCONNECTED,
	CONNECTING,
	CONNECTED,
	RECONNECTING
}

const GUEST_CFG_PATH: String = "user://guest.cfg"

@export var server_url: String = "ws://127.0.0.1:8080/ws"
@export var auto_reconnect: bool = true
@export var reconnect_delay: float = 3.0

var socket: WebSocketPeer = WebSocketPeer.new()
var current_state: ConnectionState = ConnectionState.DISCONNECTED
var local_player_id: String = ""
var _reconnect_timer: float = 0.0

func _ready() -> void:
	connect_to_server()

func _process(delta: float) -> void:
	if current_state == ConnectionState.RECONNECTING:
		_reconnect_timer -= delta
		if _reconnect_timer <= 0.0:
			_attempt_connect()
		return

	socket.poll()
	var socket_state: WebSocketPeer.State = socket.get_ready_state()

	match socket_state:
		WebSocketPeer.STATE_OPEN:
			if current_state != ConnectionState.CONNECTED:
				current_state = ConnectionState.CONNECTED
				connection_status_changed.emit("CONNECTED")
				_send_auth_packet()

			while socket.get_available_packet_count() > 0:
				var packet_raw: PackedByteArray = socket.get_packet()
				var packet_str: String = packet_raw.get_string_from_utf8()
				_handle_incoming_packet(packet_str)

		WebSocketPeer.STATE_CLOSING:
			pass

		WebSocketPeer.STATE_CLOSED:
			if current_state == ConnectionState.CONNECTED or current_state == ConnectionState.CONNECTING:
				var code: int = socket.get_close_code()
				var reason: String = socket.get_close_reason()
				current_state = ConnectionState.DISCONNECTED
				connection_status_changed.emit("DISCONNECTED (%d: %s)" % [code, reason])

				if auto_reconnect:
					current_state = ConnectionState.RECONNECTING
					_reconnect_timer = reconnect_delay
					connection_status_changed.emit("RECONNECTING...")

func connect_to_server(url: String = "") -> void:
	if not url.is_empty():
		server_url = url
	_attempt_connect()

func _attempt_connect() -> void:
	socket.close()
	current_state = ConnectionState.CONNECTING
	connection_status_changed.emit("CONNECTING...")
	var err: Error = socket.connect_to_url(server_url)
	if err != OK:
		current_state = ConnectionState.DISCONNECTED
		connection_status_changed.emit("FAILED_TO_CONNECT")
		if auto_reconnect:
			current_state = ConnectionState.RECONNECTING
			_reconnect_timer = reconnect_delay

func send_packet(packet_type: String, payload: Dictionary) -> void:
	if socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return

	var packet: Dictionary = {
		"type": packet_type,
		"data": payload,
		"timestamp": Time.get_unix_time_from_system()
	}
	var json_str: String = JSON.stringify(packet)
	socket.send_text(json_str)

func send_move_input_3d(pos: Vector3, vel: Vector3, yaw: float, action_state: int) -> void:
	send_packet("C2S_MOVE", {
		"x": snappedf(pos.x, 0.05),
		"y": snappedf(pos.y, 0.05),
		"z": snappedf(pos.z, 0.05),
		"vx": snappedf(vel.x, 0.05),
		"vy": snappedf(vel.y, 0.05),
		"vz": snappedf(vel.z, 0.05),
		"facing": snappedf(yaw, 0.02),
		"state": action_state
	})

func send_attack_3d(weapon_id: String, yaw: float) -> void:
	send_packet("C2S_ATTACK", {
		"weapon_id": weapon_id,
		"facing": snappedf(yaw, 0.02)
	})

func send_equipment_change(weapon_id: String, armor_id: String) -> void:
	send_packet("C2S_EQUIPMENT", {
		"weapon_id": weapon_id,
		"armor_id": armor_id
	})

func _send_auth_packet() -> void:
	send_packet("C2S_AUTH", {
		"guest_id": _get_or_create_guest_id(),
		"client_version": "0.2.0",
		"device_platform": OS.get_name()
	})

## Guest id persisten per-device (sementara, sebelum sistem auth akun).
func _get_or_create_guest_id() -> String:
	var cfg: ConfigFile = ConfigFile.new()
	var err: Error = cfg.load(GUEST_CFG_PATH)
	if err == OK:
		var saved: String = str(cfg.get_value("auth", "guest_id", ""))
		if not saved.is_empty():
			return saved
	var bytes: PackedByteArray = Crypto.new().generate_random_bytes(16)
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	var hex: String = bytes.hex_encode()
	var guest_id: String = "%s-%s-%s-%s-%s" % [hex.substr(0, 8), hex.substr(8, 4), hex.substr(12, 4), hex.substr(16, 4), hex.substr(20, 12)]
	cfg.set_value("auth", "guest_id", guest_id)
	cfg.save(GUEST_CFG_PATH)
	return guest_id

func _handle_incoming_packet(packet_str: String) -> void:
	var json: JSON = JSON.new()
	var error: Error = json.parse(packet_str)
	if error != OK:
		return

	var packet: Dictionary = json.data
	var p_type: String = packet.get("type", "")
	var data: Dictionary = packet.get("data", {})

	match p_type:
		"S2C_AUTH_SUCCESS":
			local_player_id = data.get("player_id", "")
			player_authenticated.emit(local_player_id)

		"S2C_ENTITY_SPAWN":
			var entity_id: String = data.get("id", "")
			entity_spawned.emit(entity_id, data)

		"S2C_ENTITY_DESPAWN":
			var entity_id: String = data.get("id", "")
			entity_despawned.emit(entity_id)

		"S2C_WORLD_STATE":
			var entities: Array = data.get("entities", [])
			world_state_received.emit(entities)

		"S2C_PLAYER_ATTACK":
			var attacker_id: String = data.get("attacker_id", "")
			var weapon_id: String = data.get("weapon_id", "")
			var yaw: float = float(data.get("facing", 0.0))
			player_attacked.emit(attacker_id, weapon_id, yaw)

		"S2C_EQUIPMENT_CHANGE":
			var entity_id: String = data.get("entity_id", "")
			var weapon_id: String = data.get("weapon_id", "")
			var armor_id: String = data.get("armor_id", "")
			player_equipment_updated.emit(entity_id, weapon_id, armor_id)
