class_name StatsComponent
extends Node
## Mengelola 6 atribut dasar (STR, AGI, VIT, INT, DEX, LUK),
## level, EXP, Mana, serta menghitung stat turunan (HP, ATK, MATK, DEF, Critical, Speed).

signal stats_changed()
signal attribute_allocated(attr_name: String, new_val: int)
signal level_changed(new_level: int)
signal exp_changed(current_exp: int, max_exp: int)
signal mana_changed(current_mana: int, max_mana: int)

# Level & Progression
@export var level: int = 1
@export var current_exp: int = 0
@export var exp_to_next_level: int = 100
@export var unspent_stat_points: int = 10

# 6 Atribut Dasar
@export var strength: int = 12: # Physical Attack & Hitbox force
	set(val):
		strength = maxi(1, val)
		_recalculate_stats()

@export var agility: int = 10: # Attack Speed & Movement Speed
	set(val):
		agility = maxi(1, val)
		_recalculate_stats()

@export var vitality: int = 12: # Max HP & HP Regen
	set(val):
		vitality = maxi(1, val)
		_recalculate_stats()

@export var intelligence: int = 10: # Magic Attack & Max Mana
	set(val):
		intelligence = maxi(1, val)
		_recalculate_stats()

@export var dexterity: int = 10: # Hit Rate & Critical Chance
	set(val):
		dexterity = maxi(1, val)
		_recalculate_stats()

@export var luck: int = 10: # Critical Damage & Drop Rate
	set(val):
		luck = maxi(1, val)
		_recalculate_stats()

# Bonus Eksternal (Equipment)
var bonus_physical_attack: int = 0
var bonus_magic_attack: int = 0
var bonus_defense: int = 0
var bonus_max_hp: int = 0
var bonus_move_speed: float = 0.0

# Stat Turunan Terhitung
var max_health: int = 150
var max_mana: int = 60
var current_mana: int = 60
var physical_attack: int = 25
var magic_attack: int = 20
var defense: int = 10
var movement_speed: float = 6.5 # Dalam meter per detik (3D scale)
var attack_speed: float = 1.0 # Multiplier kecepatan animasi
var critical_chance: float = 0.1 # 10%
var critical_multiplier: float = 1.5 # 150%

func _ready() -> void:
	_recalculate_stats()
	current_mana = max_mana
	mana_changed.emit(current_mana, max_mana)
	exp_changed.emit(current_exp, exp_to_next_level)

func allocate_point(attr: String) -> bool:
	if unspent_stat_points <= 0:
		return false

	match attr.to_upper():
		"STR": strength += 1
		"AGI": agility += 1
		"VIT": vitality += 1
		"INT": intelligence += 1
		"DEX": dexterity += 1
		"LUK": luck += 1
		_: return false

	unspent_stat_points -= 1
	attribute_allocated.emit(attr, get_attribute(attr))
	return true

func get_attribute(attr: String) -> int:
	match attr.to_upper():
		"STR": return strength
		"AGI": return agility
		"VIT": return vitality
		"INT": return intelligence
		"DEX": return dexterity
		"LUK": return luck
		_: return 0

func set_equipment_bonuses(atk: int, matk: int, def: int, hp: int, speed: float) -> void:
	bonus_physical_attack = atk
	bonus_magic_attack = matk
	bonus_defense = def
	bonus_max_hp = hp
	bonus_move_speed = speed
	_recalculate_stats()

func gain_exp(amount: int) -> void:
	if amount <= 0:
		return
	current_exp += amount
	while current_exp >= exp_to_next_level and level < 99:
		current_exp -= exp_to_next_level
		level += 1
		exp_to_next_level = int(exp_to_next_level * 1.35) + 50
		unspent_stat_points += 5
		_recalculate_stats()
		current_mana = max_mana
		level_changed.emit(level)
		if EventBus != null:
			EventBus.player_leveled_up.emit(level, unspent_stat_points)
	
	exp_changed.emit(current_exp, exp_to_next_level)

func use_mana(amount: int) -> bool:
	if current_mana < amount:
		return false
	current_mana = maxi(0, current_mana - amount)
	mana_changed.emit(current_mana, max_mana)
	return true

func restore_mana(amount: int) -> void:
	current_mana = mini(max_mana, current_mana + amount)
	mana_changed.emit(current_mana, max_mana)

func _recalculate_stats() -> void:
	max_health = 80 + (vitality * 18) + (level * 12) + bonus_max_hp
	max_mana = 30 + (intelligence * 10) + (level * 5)
	defense = 5 + int(vitality * 0.8) + bonus_defense
	physical_attack = 10 + (strength * 3) + (level * 2) + bonus_physical_attack
	magic_attack = 10 + (intelligence * 3) + (level * 2) + bonus_magic_attack
	movement_speed = clampf(5.5 + (agility * 0.08) + bonus_move_speed, 4.0, 10.0)
	attack_speed = clampf(1.0 + (agility * 0.015), 0.8, 2.5)
	critical_chance = clampf(0.05 + (dexterity * 0.006), 0.05, 0.8)
	critical_multiplier = 1.5 + (luck * 0.012)

	stats_changed.emit()
