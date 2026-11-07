class_name HealthComponent
extends Node
## Mengelola Health (HP), penerimaan damage, invulnerability, dan event kematian.

signal health_changed(current_hp: int, max_hp: int)
signal damage_received(amount: int, is_critical: bool, attack_type: String)
signal died()

@export var max_health: int = 100:
	set(val):
		max_health = maxi(1, val)
		current_health = mini(current_health, max_health)
		health_changed.emit(current_health, max_health)

@export var current_health: int = 100
@export var invulnerability_duration: float = 0.2

var is_invulnerable: bool = false
var _invuln_timer: float = 0.0

func _ready() -> void:
	current_health = max_health
	health_changed.emit(current_health, max_health)

func _process(delta: float) -> void:
	if is_invulnerable:
		_invuln_timer -= delta
		if _invuln_timer <= 0.0:
			is_invulnerable = false

func take_damage(amount: int, is_critical: bool = false, attack_type: String = "PHYSICAL") -> int:
	if is_invulnerable or current_health <= 0:
		return 0
		
	var actual_damage: int = maxi(1, amount)
	current_health = maxi(0, current_health - actual_damage)
	
	is_invulnerable = true
	_invuln_timer = invulnerability_duration
	
	damage_received.emit(actual_damage, is_critical, attack_type)
	health_changed.emit(current_health, max_health)
	
	if current_health <= 0:
		died.emit()
		
	return actual_damage

func heal(amount: int) -> void:
	if current_health <= 0:
		return
	current_health = mini(max_health, current_health + maxi(0, amount))
	health_changed.emit(current_health, max_health)

