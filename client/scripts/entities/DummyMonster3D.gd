class_name DummyMonster3D
extends CharacterBody3D
## Entitas Monster 3D Menggunakan Model KayKit Rigged (.glb) dengan Aggro AI.
## Melacak pemain terdekat, mengejar (Chase), menyerang dengan HitboxComponent 3D,
## dan respawn kembali di spawn point saat mati serta memberikan EXP.

enum MonsterState {
	IDLE,
	CHASE,
	ATTACK,
	HURT,
	DEATH
}

@export var monster_name: String = "Abyssal Skeleton"
@export var max_hp: int = 150
@export var monster_variant: int = 0
@export var aggro_radius: float = 8.0
@export var attack_range: float = 1.9
@export var move_speed: float = 3.6
@export var exp_reward: int = 45
@export var attack_damage: int = 18

@onready var health_component: HealthComponent = $HealthComponent
@onready var hurtbox_component: HurtboxComponent = $HurtboxComponent
@onready var hitbox_component: HitboxComponent = $HitboxComponent

var _current_state: MonsterState = MonsterState.IDLE
var _model_instance: Node3D = null
var _anim_player: AnimationPlayer = null
var _hp_label: Label3D = null

var _spawn_origin: Vector3 = Vector3.ZERO
var _target_player: Node3D = null
var _attack_cooldown_timer: float = 0.0
var _respawn_timer: float = 0.0
var _hurt_timer: float = 0.0
var _attack_duration_timer: float = 0.0

func _ready() -> void:
	_spawn_origin = global_position
	if health_component != null:
		health_component.max_health = max_hp
		health_component.current_health = max_hp
		health_component.health_changed.connect(_on_health_changed)
		health_component.died.connect(_on_died)

	if hurtbox_component != null:
		hurtbox_component.hit_received.connect(_on_hit_received)

	if hitbox_component != null:
		hitbox_component.source_attacker = self
		hitbox_component.base_damage = attack_damage
		hitbox_component.set_active(false)

	_build_monster_visuals()
	_update_hp_label()

func _build_monster_visuals() -> void:
	var candidate_paths: Array[String] = [
		"res://assets/models/skeletons/Skeleton_Warrior.glb",
		"res://assets/models/skeletons/Skeleton_Mage.glb",
		"res://assets/models/skeletons/Skeleton_Rogue.glb",
		"res://assets/models/skeletons/Skeleton_Minion.glb"
	]

	var selected_idx: int = posmod(monster_variant, candidate_paths.size())
	var target_path: String = candidate_paths[selected_idx]
	if ResourceLoader.exists(target_path):
		var packed: PackedScene = load(target_path) as PackedScene
		if packed != null:
			_model_instance = packed.instantiate() as Node3D
			add_child(_model_instance)
			_anim_player = _model_instance.find_child("AnimationPlayer", true, false) as AnimationPlayer
			_play_anim("Idle", true)

	_hp_label = Label3D.new()
	_hp_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_hp_label.position = Vector3(0.0, 2.55, 0.0)
	_hp_label.font_size = 28
	_hp_label.outline_size = 8
	_hp_label.modulate = Color(1.0, 0.45, 0.45)
	add_child(_hp_label)

func _physics_process(delta: float) -> void:
	if _current_state == MonsterState.DEATH:
		_respawn_timer -= delta
		if _respawn_timer <= 0.0:
			_respawn()
		return

	if _hurt_timer > 0.0:
		_hurt_timer -= delta
		if _hurt_timer <= 0.0 and _current_state == MonsterState.HURT:
			_current_state = MonsterState.IDLE

	if _attack_cooldown_timer > 0.0:
		_attack_cooldown_timer -= delta

	if _attack_duration_timer > 0.0:
		_attack_duration_timer -= delta
		if _attack_duration_timer <= 0.0:
			if hitbox_component != null:
				hitbox_component.set_active(false)
			if _current_state == MonsterState.ATTACK:
				_current_state = MonsterState.IDLE

	# Cari player jika belum punya target
	if _target_player == null or not is_instance_valid(_target_player):
		_find_nearest_player()

	if _target_player != null and is_instance_valid(_target_player):
		var to_player: Vector3 = _target_player.global_position - global_position
		to_player.y = 0.0
		var dist: float = to_player.length()

		match _current_state:
			MonsterState.IDLE:
				if dist <= aggro_radius:
					_current_state = MonsterState.CHASE

			MonsterState.CHASE:
				if dist > aggro_radius * 1.6:
					# Leash back to spawn origin jika terlalu jauh
					_return_to_spawn(delta)
				elif dist <= attack_range:
					_current_state = MonsterState.ATTACK
					velocity = Vector3.ZERO
				else:
					var move_dir: Vector3 = to_player.normalized()
					velocity.x = move_dir.x * move_speed
					velocity.z = move_dir.z * move_speed
					rotation.y = lerp_angle(rotation.y, atan2(move_dir.x, move_dir.z), 10.0 * delta)
					_play_anim("Walking_A", true)
					move_and_slide()

			MonsterState.ATTACK:
				var move_dir: Vector3 = to_player.normalized()
				if to_player.length_squared() > 0.01:
					rotation.y = lerp_angle(rotation.y, atan2(move_dir.x, move_dir.z), 12.0 * delta)
				if _attack_cooldown_timer <= 0.0 and _attack_duration_timer <= 0.0:
					_execute_attack()
				elif _attack_duration_timer <= 0.0:
					if dist > attack_range * 1.2:
						_current_state = MonsterState.CHASE
					else:
						_play_anim("Idle", true)

			MonsterState.HURT:
				velocity = Vector3.ZERO
	else:
		_return_to_spawn(delta)

func _find_nearest_player() -> void:
	var players: Array[Node] = get_tree().get_nodes_in_group("players")
	if players.is_empty():
		var p: Node = get_tree().root.find_child("Player3D", true, false)
		if p != null:
			_target_player = p as Node3D
	else:
		_target_player = players[0] as Node3D

func _return_to_spawn(delta: float) -> void:
	var to_origin: Vector3 = _spawn_origin - global_position
	to_origin.y = 0.0
	if to_origin.length() > 0.5:
		var dir: Vector3 = to_origin.normalized()
		velocity.x = dir.x * (move_speed * 0.8)
		velocity.z = dir.z * (move_speed * 0.8)
		rotation.y = lerp_angle(rotation.y, atan2(dir.x, dir.z), 8.0 * delta)
		_play_anim("Walking_A", true)
		move_and_slide()
	else:
		velocity = Vector3.ZERO
		_current_state = MonsterState.IDLE
		_play_anim("Idle", true)

func _execute_attack() -> void:
	_attack_cooldown_timer = 1.8
	_attack_duration_timer = 0.65
	_play_anim("1H_Melee_Attack_Chop", false)

	# Aktifkan hitbox tepat di frame pukulan tangan (sekitar 0.25s)
	get_tree().create_timer(0.25).timeout.connect(func():
		if is_instance_valid(self) and _current_state != MonsterState.DEATH and _attack_duration_timer > 0.0:
			if hitbox_component != null:
				hitbox_component.base_damage = attack_damage
				hitbox_component.set_active(true)
			# Matikan kembali hitbox setelah frame ayunan selesai (0.22s kemudian)
			get_tree().create_timer(0.22).timeout.connect(func():
				if is_instance_valid(self) and hitbox_component != null:
					hitbox_component.set_active(false)
			)
	)

func _on_hit_received(hitbox: HitboxComponent, damage: int) -> void:
	if _current_state == MonsterState.DEATH:
		return

	_current_state = MonsterState.HURT
	_hurt_timer = 0.35
	_play_anim("Hit_A", false)

	var dmg_num: DamageNumber = DamageNumber.new()
	get_parent().add_child(dmg_num)
	dmg_num.global_position = global_position + Vector3(0.0, 1.9, 0.0)
	var is_crit: bool = hitbox.is_critical if hitbox != null else false
	var atk_type: String = hitbox.attack_type if hitbox != null else "PHYSICAL"
	dmg_num.init(damage, is_crit, atk_type)

	# Jika diserang pemain, aggro ke pemain penyerang
	if hitbox != null and hitbox.source_attacker != null:
		if hitbox.source_attacker.is_in_group("players"):
			_target_player = hitbox.source_attacker

func _on_health_changed(_curr: int, _max: int) -> void:
	_update_hp_label()

func _update_hp_label() -> void:
	if _hp_label != null and health_component != null:
		_hp_label.text = "%s\nHP: %d / %d" % [monster_name, health_component.current_health, health_component.max_health]

func _on_died() -> void:
	_current_state = MonsterState.DEATH
	if hitbox_component != null:
		hitbox_component.set_active(false)
	_play_anim("Death_A", false)
	_respawn_timer = 5.0
	velocity = Vector3.ZERO
	if _hp_label != null:
		_hp_label.text = "%s\n[DEFEATED]" % monster_name

	if EventBus != null:
		EventBus.monster_defeated.emit(exp_reward, monster_name)

func _respawn() -> void:
	global_position = _spawn_origin
	_current_state = MonsterState.IDLE
	if health_component != null:
		health_component.current_health = health_component.max_health
	_update_hp_label()
	_play_anim("Idle", true)

func _play_anim(anim_name: String, loop: bool) -> void:
	if _anim_player == null or not _anim_player.has_animation(anim_name):
		return
	var anim_res: Animation = _anim_player.get_animation(anim_name)
	if anim_res != null:
		anim_res.loop_mode = Animation.LOOP_LINEAR if loop else Animation.LOOP_NONE
	_anim_player.play(anim_name, 0.12)
