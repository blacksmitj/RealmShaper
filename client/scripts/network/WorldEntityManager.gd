class_name WorldEntityManager
extends Node3D
## Mengelola siklus hidup Remote Players & Entitas multiplayer di dunia 3D berdasarkan snapshot server.

var _spawned_players: Dictionary = {} # entity_id -> RemotePlayer3D node

func _ready() -> void:
	if NetworkManager != null:
		NetworkManager.entity_spawned.connect(_on_entity_spawned)
		NetworkManager.entity_despawned.connect(_on_entity_despawned)
		NetworkManager.world_state_received.connect(_on_world_state_received)
		NetworkManager.player_attacked.connect(_on_player_attacked)
		NetworkManager.player_equipment_updated.connect(_on_player_equipment_updated)

func _on_entity_spawned(entity_id: String, data: Dictionary) -> void:
	if NetworkManager != null and entity_id == NetworkManager.local_player_id:
		return
	if _spawned_players.has(entity_id):
		return

	var remote_player: RemotePlayer3D = RemotePlayer3D.new()
	remote_player.entity_id = entity_id
	var px: float = float(data.get("x", 0.0))
	var py: float = float(data.get("y", 0.0))
	var pz: float = float(data.get("z", 0.0))
	remote_player.position = Vector3(px, py, pz)
	remote_player.player_name = str(data.get("name", "Traveler_" + entity_id.substr(0, 4)))

	add_child(remote_player)
	_spawned_players[entity_id] = remote_player

func _on_entity_despawned(entity_id: String) -> void:
	if _spawned_players.has(entity_id):
		var p: Node = _spawned_players[entity_id]
		p.queue_free()
		_spawned_players.erase(entity_id)

func _on_world_state_received(entities: Array) -> void:
	for entity_info: Dictionary in entities:
		var e_id: String = str(entity_info.get("id", ""))
		if NetworkManager != null and e_id == NetworkManager.local_player_id:
			continue

		if not _spawned_players.has(e_id):
			_on_entity_spawned(e_id, entity_info)
		else:
			var player_node: RemotePlayer3D = _spawned_players[e_id]
			var px: float = float(entity_info.get("x", 0.0))
			var py: float = float(entity_info.get("y", 0.0))
			var pz: float = float(entity_info.get("z", 0.0))
			var facing: float = float(entity_info.get("facing", 0.0))
			var action_state: int = int(entity_info.get("state", 0))
			player_node.update_state(Vector3(px, py, pz), facing, action_state)

func _on_player_attacked(attacker_id: String, _weapon_id: String, facing_yaw: float) -> void:
	if _spawned_players.has(attacker_id):
		var player_node: RemotePlayer3D = _spawned_players[attacker_id]
		player_node.play_attack(facing_yaw)

func _on_player_equipment_updated(entity_id: String, weapon_id: String, armor_id: String) -> void:
	if _spawned_players.has(entity_id):
		var player_node: RemotePlayer3D = _spawned_players[entity_id]
		player_node.update_equipment(weapon_id, armor_id)
