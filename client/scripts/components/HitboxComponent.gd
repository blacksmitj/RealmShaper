class_name HitboxComponent
extends Area3D
## Area 3D yang memicu damage ke Hurtbox lawan saat serangan aktif.

signal hit_landed(target_hurtbox: HurtboxComponent, damage_dealt: int)

@export var base_damage: int = 15
@export var is_critical: bool = false
@export var attack_type: String = "PHYSICAL" # "PHYSICAL" atau "MAGIC"
@export var knockback_force: float = 6.0

var source_attacker: Node3D = null

func _ready() -> void:
	monitoring = false
	monitorable = false

func set_active(active: bool) -> void:
	set_deferred("monitoring", active)
	set_deferred("monitorable", active)
