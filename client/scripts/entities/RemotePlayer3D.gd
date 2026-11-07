class_name RemotePlayer3D
extends Node3D
## Entitas Pemain Lain (Multiplayer) di ruang 3D dengan interpolasi posisi & rotasi halus,
## serta penyesuaian visual senjata & armor.

@export var entity_id: String = ""
@export var player_name: String = "Traveler"

var visualizer: CharacterVisualizer3D
var _target_pos: Vector3 = Vector3.ZERO
var _target_yaw: float = 0.0
var _name_label: Label3D

func _ready() -> void:
	visualizer = CharacterVisualizer3D.new()
	add_child(visualizer)

	_name_label = Label3D.new()
	_name_label.text = player_name
	_name_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_name_label.position = Vector3(0.0, 2.1, 0.0)
	_name_label.font_size = 24
	_name_label.outline_size = 6
	_name_label.modulate = Color(0.85, 0.9, 1.0)
	add_child(_name_label)

func update_state(new_pos: Vector3, facing_yaw: float, action_state: int) -> void:
	_target_pos = new_pos
	_target_yaw = facing_yaw
	if visualizer != null and visualizer.current_action_state != CharacterVisualizer3D.ActionState.ATTACK:
		visualizer.current_action_state = action_state as CharacterVisualizer3D.ActionState

func play_attack(facing_yaw: float) -> void:
	_target_yaw = facing_yaw
	if visualizer != null:
		visualizer.rotation.y = facing_yaw
		visualizer.trigger_attack()

func update_equipment(weapon_id: String, armor_id: String) -> void:
	if visualizer == null:
		return
	var wpn_path: String = "res://resources/weapons/IronGreatsword.tres"
	if weapon_id.contains("dagger"):
		wpn_path = "res://resources/weapons/CrimsonDagger.tres"
	elif weapon_id.contains("bow") or weapon_id.contains("crossbow"):
		wpn_path = "res://resources/weapons/HuntingBow.tres"
	elif weapon_id.contains("staff"):
		wpn_path = "res://resources/weapons/ArcaneStaff.tres"

	if ResourceLoader.exists(wpn_path):
		var wpn: WeaponData = load(wpn_path) as WeaponData
		if wpn != null:
			visualizer.equip_weapon(wpn)

	var arm_path: String = "res://resources/armor/IronPlate.tres"
	if armor_id.contains("shadow") or armor_id.contains("robe"):
		arm_path = "res://resources/armor/ShadowRobe.tres"

	if ResourceLoader.exists(arm_path):
		var arm: ArmorData = load(arm_path) as ArmorData
		if arm != null:
			visualizer.equip_armor(arm)

func _process(delta: float) -> void:
	global_position = global_position.lerp(_target_pos, 12.0 * delta)
	if visualizer != null:
		visualizer.rotation.y = lerp_angle(visualizer.rotation.y, _target_yaw, 12.0 * delta)
