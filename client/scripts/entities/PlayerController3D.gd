class_name PlayerController3D
extends CharacterBody3D
## Controller Karakter Utama 3D untuk RealmShaper: Online.
## Mendukung rotasi model 3D halus, camera-relative movement, Virtual Joystick,
## 3D Physics Raycast Tap-to-Move, Smart Auto-Face targeting, Dash, Skills, Socket Weapon/Armor,
## serta Player Damage Reaction, DEF Mitigation & Safe Altar Respawn.

const WEAPONS: Array[String] = [
	"res://resources/weapons/IronGreatsword.tres",
	"res://resources/weapons/CrimsonDagger.tres",
	"res://resources/weapons/HuntingBow.tres",
	"res://resources/weapons/ArcaneStaff.tres"
]

const ARMORS: Array[String] = [
	"res://resources/armor/IronPlate.tres",
	"res://resources/armor/ShadowRobe.tres"
]

@export var jump_velocity: float = 7.5
@export var rotation_speed: float = 14.0
@export var acceleration: float = 18.0
@export var gravity: float = 22.0
@export var camera_controller: OrbitCamera3D

@onready var visualizer: CharacterVisualizer3D = $CharacterVisualizer3D
@onready var health_component: HealthComponent = $HealthComponent
@onready var stats_component: StatsComponent = $StatsComponent
@onready var hitbox_component: HitboxComponent = $CharacterVisualizer3D/HitboxComponent
@onready var hurtbox_component: HurtboxComponent = $HurtboxComponent

var _joystick_vector: Vector2 = Vector2.ZERO
var _has_tap_target: bool = false
var _tap_target_pos: Vector3 = Vector3.ZERO

var _loaded_weapons: Array[WeaponData] = []
var _loaded_armors: Array[ArmorData] = []
var _current_weapon_idx: int = 0
var _current_armor_idx: int = 0

var _dash_timer: float = 0.0
var _dash_cooldown: float = 0.0
var _dash_direction: Vector3 = Vector3.FORWARD
var _net_sync_timer: float = 0.0
var _is_dead: bool = false
var _respawn_pos: Vector3 = Vector3(0.0, 0.0, 2.0)

func _ready() -> void:
	add_to_group("players")
	floor_snap_length = 0.35
	floor_max_angle = deg_to_rad(50.0)
	_respawn_pos = global_position

	_preload_resources()

	if hitbox_component != null:
		hitbox_component.source_attacker = self

	if hurtbox_component != null:
		hurtbox_component.hit_received.connect(_on_hurtbox_hit_received)

	if health_component != null:
		health_component.died.connect(_on_player_died)

	if visualizer != null:
		visualizer.attack_hit_frame.connect(_on_attack_hit_frame)
		visualizer.attack_finished.connect(_on_attack_finished)

	if stats_component != null:
		stats_component.stats_changed.connect(_on_stats_changed)
		if health_component != null:
			health_component.current_health = stats_component.max_health
			health_component.max_health = stats_component.max_health

	if EventBus != null:
		EventBus.joystick_moved.connect(_on_joystick_moved)
		EventBus.joystick_released.connect(_on_joystick_released)
		EventBus.move_target_requested.connect(_on_move_target_requested)
		EventBus.move_target_cancelled.connect(_on_move_target_cancelled)
		EventBus.attack_button_pressed.connect(perform_attack)
		EventBus.dash_button_pressed.connect(perform_dash)
		EventBus.skill_button_pressed.connect(perform_skill)
		EventBus.weapon_swap_requested.connect(swap_weapon)
		EventBus.armor_swap_requested.connect(swap_armor)
		EventBus.monster_defeated.connect(_on_monster_defeated)
		EventBus.player_spawned.emit(self)

	# Inisialisasi perlengkapan pertama
	if not _loaded_weapons.is_empty():
		_apply_current_weapon()
	if not _loaded_armors.is_empty():
		_apply_current_armor()

func _preload_resources() -> void:
	for path in WEAPONS:
		if ResourceLoader.exists(path):
			var res: WeaponData = load(path) as WeaponData
			if res != null:
				_loaded_weapons.append(res)
	for path in ARMORS:
		if ResourceLoader.exists(path):
			var res: ArmorData = load(path) as ArmorData
			if res != null:
				_loaded_armors.append(res)

func _physics_process(delta: float) -> void:
	if _is_dead:
		velocity = Vector3.ZERO
		return

	if not is_on_floor():
		velocity.y -= gravity * delta
	elif Input.is_key_pressed(KEY_SHIFT):
		velocity.y = jump_velocity
	else:
		velocity.y = 0.0

	if _dash_cooldown > 0.0:
		_dash_cooldown -= delta

	# Tangani Dash Impulse
	if _dash_timer > 0.0:
		_dash_timer -= delta
		velocity.x = _dash_direction.x * 16.0
		velocity.z = _dash_direction.z * 16.0
		move_and_slide()
		return

	var input_dir: Vector2 = _joystick_vector
	if input_dir.is_zero_approx():
		if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
			input_dir.y -= 1.0
		if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
			input_dir.y += 1.0
		if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
			input_dir.x -= 1.0
		if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
			input_dir.x += 1.0

	if Input.is_action_just_pressed("ui_accept") or Input.is_key_pressed(KEY_SPACE):
		perform_attack()

	input_dir = input_dir.normalized()

	var cam_yaw: float = 0.0
	if camera_controller != null:
		cam_yaw = camera_controller.get_camera_yaw()
	elif get_viewport().get_camera_3d() != null:
		cam_yaw = get_viewport().get_camera_3d().global_rotation.y

	var move_direction: Vector3 = Vector3.ZERO
	if not input_dir.is_zero_approx():
		_has_tap_target = false
		var forward: Vector3 = -Vector3(sin(cam_yaw), 0.0, cos(cam_yaw))
		var right: Vector3 = Vector3(cos(cam_yaw), 0.0, -sin(cam_yaw))
		move_direction = (right * input_dir.x + forward * -input_dir.y).normalized()
	elif _has_tap_target:
		var to_target: Vector3 = _tap_target_pos - global_position
		to_target.y = 0.0
		if to_target.length() > 0.35:
			move_direction = to_target.normalized()
		else:
			_has_tap_target = false

	var cur_speed: float = stats_component.movement_speed if stats_component != null else 6.5

	if move_direction.length_squared() > 0.01:
		velocity.x = lerp(velocity.x, move_direction.x * cur_speed, acceleration * delta)
		velocity.z = lerp(velocity.z, move_direction.z * cur_speed, acceleration * delta)

		var target_angle: float = atan2(move_direction.x, move_direction.z)
		if visualizer != null:
			visualizer.rotation.y = lerp_angle(visualizer.rotation.y, target_angle, rotation_speed * delta)
			if visualizer.current_action_state != CharacterVisualizer3D.ActionState.ATTACK and visualizer.current_action_state != CharacterVisualizer3D.ActionState.HURT:
				visualizer.current_action_state = CharacterVisualizer3D.ActionState.WALK
	else:
		velocity.x = lerp(velocity.x, 0.0, acceleration * delta)
		velocity.z = lerp(velocity.z, 0.0, acceleration * delta)
		if visualizer != null and visualizer.current_action_state != CharacterVisualizer3D.ActionState.ATTACK and visualizer.current_action_state != CharacterVisualizer3D.ActionState.HURT:
			visualizer.current_action_state = CharacterVisualizer3D.ActionState.IDLE

	move_and_slide()

	# Sinkronisasi ke NetworkManager & EventBus pada 20Hz (0.05s)
	_net_sync_timer += delta
	if _net_sync_timer >= 0.05:
		_net_sync_timer = 0.0
		if EventBus != null and velocity.length_squared() > 0.01:
			EventBus.player_position_changed.emit(global_position)
		if NetworkManager != null:
			var yaw: float = visualizer.rotation.y if visualizer != null else 0.0
			var a_state: int = visualizer.current_action_state if visualizer != null else 0
			NetworkManager.send_move_input_3d(global_position, velocity, yaw, a_state)

func perform_attack() -> void:
	if _is_dead:
		return
	_smart_auto_face_target()
	if visualizer != null:
		visualizer.trigger_attack()
	if NetworkManager != null and not _loaded_weapons.is_empty():
		var wpn: WeaponData = _loaded_weapons[_current_weapon_idx]
		var yaw: float = visualizer.rotation.y if visualizer != null else 0.0
		NetworkManager.send_attack_3d(wpn.weapon_id, yaw)

func perform_dash() -> void:
	if _is_dead or _dash_cooldown > 0.0 or _dash_timer > 0.0:
		return
	_dash_cooldown = 1.8
	_dash_timer = 0.22
	if visualizer != null:
		var forward_angle: float = visualizer.rotation.y
		_dash_direction = Vector3(sin(forward_angle), 0.0, cos(forward_angle)).normalized()
	if health_component != null:
		health_component.is_invulnerable = true
		get_tree().create_timer(0.35).timeout.connect(func():
			if health_component != null:
				health_component.is_invulnerable = false
		)

func perform_skill(skill_index: int) -> void:
	if _is_dead:
		return
	var mana_cost: int = 15 if skill_index == 1 else 25
	if stats_component == null or not stats_component.use_mana(mana_cost):
		return

	_smart_auto_face_target()
	if visualizer != null:
		visualizer.trigger_attack()

	# Serangan Skill Area (AoE)
	var atk_bonus: int = (stats_component.physical_attack if skill_index == 1 else stats_component.magic_attack) * 2
	var targets: Array[Node] = get_tree().get_nodes_in_group("monsters")
	for m in targets:
		var monster := m as Node3D
		if monster != null and global_position.distance_to(monster.global_position) <= 5.0:
			var hurtbox: HurtboxComponent = monster.get_node_or_null("HurtboxComponent") as HurtboxComponent
			if hurtbox != null:
				var h_comp: HealthComponent = monster.get_node_or_null("HealthComponent") as HealthComponent
				if h_comp != null:
					var is_magic: bool = (skill_index == 2)
					var dmg: int = h_comp.take_damage(atk_bonus, true, "MAGIC" if is_magic else "PHYSICAL")
					var dmg_num: DamageNumber = DamageNumber.new()
					get_parent().add_child(dmg_num)
					dmg_num.global_position = monster.global_position + Vector3(0.0, 2.0, 0.0)
					dmg_num.init(dmg, true, "MAGIC" if is_magic else "PHYSICAL")

func _smart_auto_face_target() -> void:
	var nearest_monster: Node3D = null
	var min_dist: float = 8.5
	for m in get_tree().get_nodes_in_group("monsters"):
		var monster := m as Node3D
		if monster != null:
			var d: float = global_position.distance_to(monster.global_position)
			if d < min_dist:
				min_dist = d
				nearest_monster = monster

	if nearest_monster != null and visualizer != null:
		var to_m: Vector3 = nearest_monster.global_position - global_position
		to_m.y = 0.0
		if to_m.length() > 0.1:
			visualizer.rotation.y = atan2(to_m.x, to_m.z)

func swap_weapon() -> void:
	if _is_dead or _loaded_weapons.is_empty():
		return
	_current_weapon_idx = (_current_weapon_idx + 1) % _loaded_weapons.size()
	_apply_current_weapon()

func swap_armor() -> void:
	if _is_dead or _loaded_armors.is_empty():
		return
	_current_armor_idx = (_current_armor_idx + 1) % _loaded_armors.size()
	_apply_current_armor()

func _apply_current_weapon() -> void:
	if _loaded_weapons.is_empty():
		return
	var wpn: WeaponData = _loaded_weapons[_current_weapon_idx]
	if visualizer != null and wpn != null:
		visualizer.equip_weapon(wpn)
	_update_equipment_stats()
	if EventBus != null and wpn != null:
		EventBus.player_attack_performed.emit(wpn.weapon_name)
	if NetworkManager != null and not _loaded_armors.is_empty():
		var arm: ArmorData = _loaded_armors[_current_armor_idx]
		NetworkManager.send_equipment_change(wpn.weapon_id, arm.armor_id)

func _apply_current_armor() -> void:
	if _loaded_armors.is_empty():
		return
	var arm: ArmorData = _loaded_armors[_current_armor_idx]
	if visualizer != null and arm != null:
		visualizer.equip_armor(arm)
	_update_equipment_stats()
	if EventBus != null and arm != null:
		EventBus.player_armor_changed.emit(arm.armor_name)
	if NetworkManager != null and not _loaded_weapons.is_empty():
		var wpn: WeaponData = _loaded_weapons[_current_weapon_idx]
		NetworkManager.send_equipment_change(wpn.weapon_id, arm.armor_id)

func _update_equipment_stats() -> void:
	if stats_component == null:
		return
	var wpn_atk: int = 0
	var wpn_matk: int = 0
	if not _loaded_weapons.is_empty():
		var wpn: WeaponData = _loaded_weapons[_current_weapon_idx]
		if wpn.attack_type == "MAGIC":
			wpn_matk = wpn.base_attack_bonus
		else:
			wpn_atk = wpn.base_attack_bonus

	var arm_def: int = 0
	var arm_hp: int = 0
	var arm_speed: float = 0.0
	if not _loaded_armors.is_empty():
		var arm: ArmorData = _loaded_armors[_current_armor_idx]
		arm_def = arm.defense_bonus
		arm_hp = arm.max_hp_bonus
		arm_speed = arm.move_speed_bonus

	stats_component.set_equipment_bonuses(wpn_atk, wpn_matk, arm_def, arm_hp, arm_speed)

func _on_stats_changed() -> void:
	if health_component != null and stats_component != null:
		var old_max: int = health_component.max_health
		var new_max: int = stats_component.max_health
		health_component.max_health = new_max
		if new_max > old_max:
			health_component.heal(new_max - old_max)
	if hurtbox_component != null and stats_component != null:
		hurtbox_component.defense_stat = stats_component.defense
	if hitbox_component != null and stats_component != null:
		hitbox_component.base_damage = stats_component.physical_attack
		hitbox_component.is_critical = randf() < stats_component.critical_chance

func _on_hurtbox_hit_received(hitbox: HitboxComponent, damage: int) -> void:
	if _is_dead:
		return

	if visualizer != null and visualizer.current_action_state != CharacterVisualizer3D.ActionState.ATTACK:
		visualizer.trigger_hurt()

	# Munculkan DamageNumber merah melayang di atas pemain
	var dmg_num: DamageNumber = DamageNumber.new()
	get_parent().add_child(dmg_num)
	dmg_num.global_position = global_position + Vector3(0.0, 1.9, 0.0)
	var is_crit: bool = hitbox.is_critical if hitbox != null else false
	var atk_type: String = hitbox.attack_type if hitbox != null else "PHYSICAL"
	dmg_num.init(damage, is_crit, atk_type)

func _on_player_died() -> void:
	if _is_dead:
		return
	_is_dead = true
	velocity = Vector3.ZERO
	if visualizer != null:
		visualizer.current_action_state = CharacterVisualizer3D.ActionState.DEATH
		visualizer._play_anim("Death_A", false)

	# Respawn setelah 3 detik ke Safe Altar
	get_tree().create_timer(3.0).timeout.connect(func():
		_respawn_player()
	)

func _respawn_player() -> void:
	global_position = _respawn_pos
	_is_dead = false
	if stats_component != null and health_component != null:
		health_component.current_health = stats_component.max_health
		health_component.health_changed.emit(health_component.current_health, health_component.max_health)
		stats_component.current_mana = stats_component.max_mana
		stats_component.mana_changed.emit(stats_component.current_mana, stats_component.max_mana)
	if health_component != null:
		health_component.is_invulnerable = true
		get_tree().create_timer(2.0).timeout.connect(func():
			if health_component != null:
				health_component.is_invulnerable = false
		)
	if visualizer != null:
		visualizer.current_action_state = CharacterVisualizer3D.ActionState.IDLE
		visualizer._play_anim("Idle", true)

func _on_monster_defeated(exp_val: int, _m_name: String) -> void:
	if stats_component != null:
		stats_component.gain_exp(exp_val)

func _on_attack_hit_frame() -> void:
	if hitbox_component != null and stats_component != null:
		hitbox_component.is_critical = randf() < stats_component.critical_chance
		hitbox_component.set_active(true)

func _on_attack_finished() -> void:
	if hitbox_component != null:
		hitbox_component.set_active(false)

func _on_joystick_moved(vec: Vector2) -> void:
	_joystick_vector = vec

func _on_joystick_released() -> void:
	_joystick_vector = Vector2.ZERO

func _on_move_target_requested(world_pos: Vector3) -> void:
	_tap_target_pos = world_pos
	_has_tap_target = true

func _on_move_target_cancelled() -> void:
	_has_tap_target = false
