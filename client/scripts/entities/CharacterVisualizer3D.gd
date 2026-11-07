class_name CharacterVisualizer3D
extends Node3D
## Visualizer Karakter 3D Menggunakan Model KayKit Adventurers (.glb).
## Menginstansiasi senjata 3D asli (.gltf) ke BoneAttachment3D/socket (handslot_r / handslot_l),
## menerapkan pewarnaan material dinamis (PGC Material Preview), dan playback AnimationPlayer.

const MODEL_PATHS: Array[String] = [
	"res://assets/models/adventurers/Knight.glb",
	"res://assets/models/adventurers/Mage.glb",
	"res://assets/models/adventurers/Rogue.glb",
	"res://assets/models/adventurers/Barbarian.glb"
]

enum ActionState {
	IDLE,
	WALK,
	ATTACK,
	HURT,
	DEATH
}

signal attack_hit_frame()
signal attack_finished()

@export var current_action_state: ActionState = ActionState.IDLE
@export var model_index: int = 0

var _model_instance: Node3D = null
var _anim_player: AnimationPlayer = null
var _current_anim: String = ""
var _attack_timer: float = 0.0
var _attack_duration: float = 0.65
var _hit_emitted: bool = false

var _current_weapon: WeaponData = null
var _current_armor: ArmorData = null
var _equipped_weapon_instance: Node3D = null
var _equipped_offhand_instance: Node3D = null

func _ready() -> void:
	load_character_model(model_index)

func load_character_model(idx: int) -> void:
	model_index = posmod(idx, MODEL_PATHS.size())
	var path: String = MODEL_PATHS[model_index]

	if _model_instance != null:
		_model_instance.queue_free()
		_model_instance = null
		_anim_player = null
		_equipped_weapon_instance = null
		_equipped_offhand_instance = null

	if ResourceLoader.exists(path):
		var packed: PackedScene = load(path) as PackedScene
		if packed != null:
			_model_instance = packed.instantiate() as Node3D
			add_child(_model_instance)
			_anim_player = _model_instance.find_child("AnimationPlayer", true, false) as AnimationPlayer
			_clear_embedded_default_weapons()
			_reapply_equipment()
			_play_anim("Idle", true)

func _clear_embedded_default_weapons() -> void:
	if _model_instance == null:
		return
	var hand_r: Node = _model_instance.find_child("handslot_r", true, false)
	if hand_r != null:
		for child in hand_r.get_children():
			if child != _equipped_weapon_instance:
				child.queue_free()
	var hand_l: Node = _model_instance.find_child("handslot_l", true, false)
	if hand_l != null:
		for child in hand_l.get_children():
			if child != _equipped_offhand_instance:
				child.queue_free()

func equip_weapon(weapon: WeaponData) -> void:
	_current_weapon = weapon
	_attach_weapon_models()

func equip_armor(armor: ArmorData) -> void:
	_current_armor = armor
	if armor != null and armor.character_model_index != model_index:
		load_character_model(armor.character_model_index)
	else:
		_apply_armor_materials()

func _reapply_equipment() -> void:
	if _current_weapon != null:
		_attach_weapon_models()
	if _current_armor != null:
		_apply_armor_materials()

func _attach_weapon_models() -> void:
	if _model_instance == null or _current_weapon == null:
		return

	var hand_r: Node = _model_instance.find_child("handslot_r", true, false)
	var hand_l: Node = _model_instance.find_child("handslot_l", true, false)

	if _equipped_weapon_instance != null and is_instance_valid(_equipped_weapon_instance):
		_equipped_weapon_instance.queue_free()
		_equipped_weapon_instance = null

	if _equipped_offhand_instance != null and is_instance_valid(_equipped_offhand_instance):
		_equipped_offhand_instance.queue_free()
		_equipped_offhand_instance = null

	# Instansiasi senjata utama di handslot_r
	if hand_r != null and not _current_weapon.model_path.is_empty():
		if ResourceLoader.exists(_current_weapon.model_path):
			var packed_wpn: PackedScene = load(_current_weapon.model_path) as PackedScene
			if packed_wpn != null:
				_equipped_weapon_instance = packed_wpn.instantiate() as Node3D
				hand_r.add_child(_equipped_weapon_instance)
				_apply_weapon_tint(_equipped_weapon_instance, _current_weapon.blade_color, _current_weapon.hilt_color)

	# Instansiasi offhand (shield/secondary) di handslot_l
	if hand_l != null and not _current_weapon.offhand_model_path.is_empty():
		if ResourceLoader.exists(_current_weapon.offhand_model_path):
			var packed_off: PackedScene = load(_current_weapon.offhand_model_path) as PackedScene
			if packed_off != null:
				_equipped_offhand_instance = packed_off.instantiate() as Node3D
				hand_l.add_child(_equipped_offhand_instance)
				_apply_weapon_tint(_equipped_offhand_instance, _current_weapon.blade_color, _current_weapon.hilt_color)

func _apply_weapon_tint(root_node: Node, primary_col: Color, accent_col: Color) -> void:
	for node in root_node.find_children("*", "MeshInstance3D", true, false):
		var mesh_inst := node as MeshInstance3D
		if mesh_inst != null:
			var mat: StandardMaterial3D = StandardMaterial3D.new()
			mat.albedo_color = primary_col
			mat.metallic = 0.65
			mat.roughness = 0.35
			mat.emission_enabled = true
			mat.emission = accent_col
			mat.emission_energy_multiplier = 0.25
			mesh_inst.material_override = mat

func _apply_armor_materials() -> void:
	if _model_instance == null or _current_armor == null:
		return
	for node in _model_instance.find_children("*", "MeshInstance3D", true, false):
		var mesh_inst := node as MeshInstance3D
		if mesh_inst != null and mesh_inst != _equipped_weapon_instance and mesh_inst != _equipped_offhand_instance:
			# Berikan tint aksen armor jika bukan mesh senjata
			var cur_mat: Material = mesh_inst.get_active_material(0)
			if cur_mat is StandardMaterial3D:
				var new_mat: StandardMaterial3D = (cur_mat as StandardMaterial3D).duplicate() as StandardMaterial3D
				new_mat.albedo_color = _current_armor.primary_color
				mesh_inst.material_override = new_mat

func _process(delta: float) -> void:
	match current_action_state:
		ActionState.IDLE:
			_play_anim("Idle", true)
		ActionState.WALK:
			_play_anim("Running_A", true)
		ActionState.ATTACK:
			_attack_timer += delta
			if _attack_timer >= _attack_duration * 0.38 and not _hit_emitted:
				_hit_emitted = true
				attack_hit_frame.emit()
			if _attack_timer >= _attack_duration:
				current_action_state = ActionState.IDLE
				attack_finished.emit()
		ActionState.HURT:
			_attack_timer += delta
			if _attack_timer >= 0.4:
				current_action_state = ActionState.IDLE

func trigger_attack() -> void:
	if current_action_state == ActionState.ATTACK:
		return
	current_action_state = ActionState.ATTACK
	_attack_timer = 0.0
	_hit_emitted = false

	var atk_anim: String = "1H_Melee_Attack_Slice_Diagonal"
	if _current_weapon != null and not _current_weapon.attack_anim_name.is_empty():
		atk_anim = _current_weapon.attack_anim_name
	elif model_index == 1:
		atk_anim = "Spellcast_Shoot"

	if _anim_player != null and not _anim_player.has_animation(atk_anim):
		# Fallback animasi jika animasi spesifik tidak ada di glb adventurer ini
		atk_anim = "1H_Melee_Attack_Chop"
		if not _anim_player.has_animation(atk_anim):
			atk_anim = "1H_Melee_Attack_Slice_Diagonal"

	_play_anim(atk_anim, false)

func trigger_hurt() -> void:
	current_action_state = ActionState.HURT
	_attack_timer = 0.0
	_play_anim("Hit_A", false)

func _play_anim(anim_name: String, loop: bool) -> void:
	if _anim_player == null or not _anim_player.has_animation(anim_name):
		return
	if _current_anim == anim_name and _anim_player.is_playing():
		return
	var anim_res: Animation = _anim_player.get_animation(anim_name)
	if anim_res != null:
		anim_res.loop_mode = Animation.LOOP_LINEAR if loop else Animation.LOOP_NONE
	_current_anim = anim_name
	_anim_player.play(anim_name, 0.12)
