class_name MapPortal
extends Area3D
## Trigger portal 3D untuk transisi antar map/realm.

signal player_entered_portal(target_map_id: String)

@export var target_map_id: String = ""
@export var portal_label: String = "Community Portal"

var _ring_mesh: MeshInstance3D = null
var _pulse_timer: float = 0.0

func _ready() -> void:
	collision_layer = 0
	collision_mask = 2 # Deteksi Player3D
	body_entered.connect(_on_body_entered)
	_setup_visuals()

func _setup_visuals() -> void:
	var col: CollisionShape3D = CollisionShape3D.new()
	var cyl: CylinderShape3D = CylinderShape3D.new()
	cyl.radius = 1.4
	cyl.height = 2.0
	col.shape = cyl
	col.position = Vector3(0, 1.0, 0)
	add_child(col)

	_ring_mesh = MeshInstance3D.new()
	var torus: TorusMesh = TorusMesh.new()
	torus.inner_radius = 1.15
	torus.outer_radius = 1.4
	_ring_mesh.mesh = torus
	_ring_mesh.position = Vector3(0, 0.1, 0)

	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = Color(0.2, 0.8, 1.0, 0.85)
	mat.emission_enabled = true
	mat.emission = Color(0.1, 0.65, 1.0)
	mat.emission_energy_multiplier = 2.2
	_ring_mesh.material_override = mat
	add_child(_ring_mesh)

	var lbl: Label3D = Label3D.new()
	lbl.text = portal_label
	lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	lbl.position = Vector3(0, 2.3, 0)
	lbl.font_size = 28
	lbl.modulate = Color(0.5, 0.95, 1.0)
	add_child(lbl)

func _process(delta: float) -> void:
	_pulse_timer += delta * 2.5
	if _ring_mesh != null:
		_ring_mesh.rotation.y += delta * 1.2
		var s: float = 1.0 + sin(_pulse_timer) * 0.08
		_ring_mesh.scale = Vector3(s, 1.0, s)

func _on_body_entered(body: Node3D) -> void:
	if body is PlayerController3D:
		player_entered_portal.emit(target_map_id)
		if EventBus != null:
			EventBus.portal_triggered.emit(target_map_id)
