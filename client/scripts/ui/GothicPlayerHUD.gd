class_name GothicPlayerHUD
extends Control
## Bar Status HP, MP & EXP Bergaya Dark Gothic RPG dengan Level & Weapon/Armor Badge.

const FRAME_TEXTURE: Texture2D = preload("res://assets/ui/bar_frame.png")

@onready var hp_bar: TextureProgressBar = $HPBar
@onready var mp_bar: TextureProgressBar = $MPBar
@onready var exp_bar: TextureProgressBar = $EXPBar
@onready var hp_label: Label = $HPBar/HPLabel
@onready var mp_label: Label = $MPBar/MPLabel
@onready var exp_label: Label = $EXPBar/EXPLabel
@onready var level_label: Label = $LevelBadge/LevelLabel
@onready var equipment_label: Label = $EquipmentLabel

var current_hp: int = 100
var max_hp: int = 100
var current_mp: int = 50
var max_mp: int = 50
var current_exp: int = 0
var max_exp: int = 100
var current_level: int = 1

var _current_weapon_name: String = "Claymore"
var _current_armor_name: String = "Knight Plate"

func _ready() -> void:
	_setup_progress_textures()
	if EventBus != null:
		EventBus.player_spawned.connect(_on_player_spawned)
		EventBus.player_attack_performed.connect(_on_weapon_changed)
		EventBus.player_armor_changed.connect(_on_armor_changed)

	# Jika Player3D sudah ter-ready lebih dulu di scene tree sebelum HUD:
	call_deferred("_try_bind_existing_player")

func _setup_progress_textures() -> void:
	var fill_tex: ImageTexture = DynamicTextureLoader.create_colored_icon(Vector2i(16, 16), Color.WHITE)
	var bg_tex: ImageTexture = DynamicTextureLoader.create_colored_icon(Vector2i(16, 16), Color(0.08, 0.08, 0.1, 0.85))
	for bar: TextureProgressBar in [hp_bar, mp_bar, exp_bar]:
		if bar != null:
			bar.texture_under = bg_tex
			bar.texture_progress = fill_tex

func _try_bind_existing_player() -> void:
	var players: Array[Node] = get_tree().get_nodes_in_group("players")
	if not players.is_empty():
		_on_player_spawned(players[0])
	else:
		var p: Node = get_tree().root.find_child("Player3D", true, false)
		if p != null:
			_on_player_spawned(p)

func _on_player_spawned(player_node: Node) -> void:
	if player_node == null:
		return
	var health_comp: HealthComponent = player_node.get_node_or_null("HealthComponent") as HealthComponent
	if health_comp != null:
		current_hp = health_comp.current_health
		max_hp = health_comp.max_health
		update_health(current_hp, max_hp)
		if not health_comp.health_changed.is_connected(update_health):
			health_comp.health_changed.connect(update_health)

	var stats_comp: StatsComponent = player_node.get_node_or_null("StatsComponent") as StatsComponent
	if stats_comp != null:
		current_mp = stats_comp.current_mana
		max_mp = stats_comp.max_mana
		update_mana(current_mp, max_mp)
		if not stats_comp.mana_changed.is_connected(update_mana):
			stats_comp.mana_changed.connect(update_mana)

		current_exp = stats_comp.current_exp
		max_exp = stats_comp.exp_to_next_level
		update_exp(current_exp, max_exp)
		if not stats_comp.exp_changed.is_connected(update_exp):
			stats_comp.exp_changed.connect(update_exp)

		current_level = stats_comp.level
		update_level(current_level)
		if not stats_comp.level_changed.is_connected(update_level):
			stats_comp.level_changed.connect(update_level)

func update_health(curr: int, maximum: int) -> void:
	current_hp = curr
	max_hp = maximum
	if hp_bar != null:
		hp_bar.max_value = max_hp
		hp_bar.value = current_hp
	if hp_label != null:
		hp_label.text = "HP %d / %d" % [current_hp, max_hp]

func update_mana(curr: int, maximum: int) -> void:
	current_mp = curr
	max_mp = maximum
	if mp_bar != null:
		mp_bar.max_value = max_mp
		mp_bar.value = current_mp
	if mp_label != null:
		mp_label.text = "MP %d / %d" % [current_mp, max_mp]

func update_exp(curr: int, maximum: int) -> void:
	current_exp = curr
	max_exp = maximum
	if exp_bar != null:
		exp_bar.max_value = max_exp
		exp_bar.value = current_exp
	if exp_label != null:
		exp_label.text = "EXP %d / %d" % [current_exp, max_exp]

func update_level(lvl: int) -> void:
	current_level = lvl
	if level_label != null:
		level_label.text = "Lv. %d" % current_level

func _on_weapon_changed(wpn_name: String) -> void:
	_current_weapon_name = wpn_name
	_update_equipment_text()

func _on_armor_changed(arm_name: String) -> void:
	_current_armor_name = arm_name
	_update_equipment_text()

func _update_equipment_text() -> void:
	if equipment_label != null:
		equipment_label.text = "%s | %s" % [_current_weapon_name, _current_armor_name]
