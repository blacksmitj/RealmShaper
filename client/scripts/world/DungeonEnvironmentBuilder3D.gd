class_name DungeonEnvironmentBuilder3D
extends Node3D
## Membangun Arena Gothic Dungeon 3D dan mendukung Runtime PGC 3D Map Loader dari JSON
## menggunakan MultiMeshInstance3D untuk ubin & dinding agar hemat draw-calls di perangkat mobile.

const DUNGEON_TEX_PATH: String = "res://assets/models/dungeon/dungeon_texture.png"
const DUMMY_MONSTER_SCENE: PackedScene = preload("res://scenes/entities/DummyMonster3D.tscn")

var _dynamic_content_root: Node3D = null
var _is_pgc_loaded: bool = false

func _ready() -> void:
	_dynamic_content_root = Node3D.new()
	_dynamic_content_root.name = "DynamicContentRoot"
	add_child(_dynamic_content_root)

	if EventBus != null:
		EventBus.map_load_requested.connect(_on_map_load_requested)

	_build_default_sanctuary()

func _on_map_load_requested(map_path_or_id: String) -> void:
	if map_path_or_id.is_empty() or map_path_or_id == "main_city":
		_build_default_sanctuary()
	elif map_path_or_id.ends_with(".json") or ResourceLoader.exists(map_path_or_id):
		_load_pgc_json_map(map_path_or_id)

func _clear_dynamic_content() -> void:
	if _dynamic_content_root != null:
		for child in _dynamic_content_root.get_children():
			child.queue_free()

func _build_default_sanctuary() -> void:
	_clear_dynamic_content()
	_is_pgc_loaded = false

	_setup_torch_lights(_dynamic_content_root)
	_decorate_with_gltf_props(_dynamic_content_root)

	# Portal PGC di altar sanctuary
	var portal: MapPortal = MapPortal.new()
	portal.target_map_id = "res://assets/data/maps/community_dungeon_01.json"
	portal.portal_label = "Realm Gate (PGC Catacombs)"
	portal.position = Vector3(0.0, 1.0, -10.5)
	_dynamic_content_root.add_child(portal)

	if EventBus != null:
		EventBus.map_loaded.emit("main_city")

func _load_pgc_json_map(json_path: String) -> void:
	if not FileAccess.file_exists(json_path):
		return

	var file: FileAccess = FileAccess.open(json_path, FileAccess.READ)
	if file == null:
		return

	var json_str: String = file.get_as_text()
	var json: JSON = JSON.new()
	if json.parse(json_str) != OK:
		return

	var map_data: Dictionary = json.data
	_clear_dynamic_content()
	_is_pgc_loaded = true

	var width: int = int(map_data.get("width", 16))
	var height: int = int(map_data.get("height", 16))
	var layers: Dictionary = map_data.get("layers", {})
	var ground_layer: Array = layers.get("ground", [])
	var collision_layer: Array = layers.get("collision", [])

	# Hitung jumlah tile lantai dan dinding untuk MultiMesh allocation
	var tile_count: int = width * height
	var wall_count: int = 0
	for c in collision_layer:
		if int(c) == 1:
			wall_count += 1

	# Material Lantai PGC
	var floor_mat: StandardMaterial3D = StandardMaterial3D.new()
	floor_mat.albedo_color = Color(0.18, 0.20, 0.26)
	floor_mat.roughness = 0.85

	# Material Dinding PGC
	var wall_mat: StandardMaterial3D = StandardMaterial3D.new()
	wall_mat.albedo_color = Color(0.32, 0.28, 0.35)
	wall_mat.roughness = 0.65

	# 1. MultiMesh untuk Lantai
	var floor_mesh_inst: MultiMeshInstance3D = MultiMeshInstance3D.new()
	var floor_mm: MultiMesh = MultiMesh.new()
	floor_mm.transform_format = MultiMesh.TRANSFORM_3D
	floor_mm.instance_count = tile_count
	var floor_box: BoxMesh = BoxMesh.new()
	floor_box.size = Vector3(2.0, 0.4, 2.0)
	floor_box.material = floor_mat
	floor_mm.mesh = floor_box
	floor_mesh_inst.multimesh = floor_mm
	_dynamic_content_root.add_child(floor_mesh_inst)

	# 2. MultiMesh untuk Dinding (jika ada dinding)
	var wall_mesh_inst: MultiMeshInstance3D = null
	var wall_mm: MultiMesh = null
	if wall_count > 0:
		wall_mesh_inst = MultiMeshInstance3D.new()
		wall_mm = MultiMesh.new()
		wall_mm.transform_format = MultiMesh.TRANSFORM_3D
		wall_mm.instance_count = wall_count
		var wall_box: BoxMesh = BoxMesh.new()
		wall_box.size = Vector3(2.0, 3.5, 2.0)
		wall_box.material = wall_mat
		wall_mm.mesh = wall_box
		wall_mesh_inst.multimesh = wall_mm
		_dynamic_content_root.add_child(wall_mesh_inst)

	var origin_x: float = -(width * 2.0) * 0.5 + 1.0
	var origin_z: float = -(height * 2.0) * 0.5 + 1.0

	var wall_idx: int = 0
	var static_body: StaticBody3D = StaticBody3D.new()
	static_body.collision_layer = 1
	_dynamic_content_root.add_child(static_body)

	# Dukungan Voxel Blocks 3D (hingga 20 tile ke atas)
	var voxel_blocks: Array = map_data.get("voxel_blocks", [])
	if not voxel_blocks.is_empty():
		for vb in voxel_blocks:
			var vb_dict := vb as Dictionary
			var bx: float = origin_x + (float(vb_dict.get("x", 0)) * 2.0)
			var by: float = (float(vb_dict.get("y", 0)) * 1.15) + 0.575
			var bz: float = origin_z + (float(vb_dict.get("z", 0)) * 2.0)
			var rot_y: float = deg_to_rad(float(vb_dict.get("rotation_y", 0.0)))

			var block_mesh: MeshInstance3D = MeshInstance3D.new()
			var box_m: BoxMesh = BoxMesh.new()
			box_m.size = Vector3(1.96, 1.12, 1.96)
			box_m.material = wall_mat
			block_mesh.mesh = box_m
			block_mesh.position = Vector3(bx, by, bz)
			block_mesh.rotation = Vector3(0.0, rot_y, 0.0)
			_dynamic_content_root.add_child(block_mesh)

			var c_shape: CollisionShape3D = CollisionShape3D.new()
			var box_shape: BoxShape3D = BoxShape3D.new()
			box_shape.size = Vector3(1.96, 1.12, 1.96)
			c_shape.shape = box_shape
			c_shape.position = Vector3(bx, by, bz)
			static_body.add_child(c_shape)

	for y in range(height):
		for x in range(width):
			var idx: int = y * width + x
			var pos_x: float = origin_x + (x * 2.0)
			var pos_z: float = origin_z + (y * 2.0)

			# Terapkan transform lantai
			var t_floor: Transform3D = Transform3D(Basis(), Vector3(pos_x, -0.2, pos_z))
			floor_mm.set_instance_transform(idx, t_floor)

			# Terapkan dinding & col collision
			var is_wall: bool = (idx < collision_layer.size() and int(collision_layer[idx]) == 1)
			if is_wall and wall_mm != null:
				var t_wall: Transform3D = Transform3D(Basis(), Vector3(pos_x, 1.75, pos_z))
				wall_mm.set_instance_transform(wall_idx, t_wall)
				wall_idx += 1

				# Collision shape dinding
				var c_shape: CollisionShape3D = CollisionShape3D.new()
				var box_shape: BoxShape3D = BoxShape3D.new()
				box_shape.size = Vector3(2.0, 3.5, 2.0)
				c_shape.shape = box_shape
				c_shape.position = Vector3(pos_x, 1.75, pos_z)
				static_body.add_child(c_shape)

	# Lantai dasar fisik (agar raycast tap-to-move selalu mendeteksi tanah)
	var floor_c_shape: CollisionShape3D = CollisionShape3D.new()
	var ground_box: BoxShape3D = BoxShape3D.new()
	ground_box.size = Vector3(width * 2.0, 0.4, height * 2.0)
	floor_c_shape.shape = ground_box
	floor_c_shape.position = Vector3(0.0, -0.2, 0.0)
	static_body.add_child(floor_c_shape)

	# Spawn monster PGC
	var spawners: Array = map_data.get("spawners", [])
	var m_variant: int = 0
	for sp in spawners:
		var sp_dict := sp as Dictionary
		var gx: float = float(sp_dict.get("x", 8.0))
		var gy: float = float(sp_dict.get("y", 8.0))
		var m_pos: Vector3 = Vector3(origin_x + (gx * 2.0), 0.0, origin_z + (gy * 2.0))
		var m_inst: DummyMonster3D = DUMMY_MONSTER_SCENE.instantiate() as DummyMonster3D
		if m_inst != null:
			m_inst.position = m_pos
			m_inst.monster_name = "Catacomb Stalker"
			m_inst.monster_variant = m_variant
			m_variant = (m_variant + 1) % 4
			_dynamic_content_root.add_child(m_inst)

	# Spawn Portal Return to Sanctuary
	var return_portal: MapPortal = MapPortal.new()
	return_portal.target_map_id = "main_city"
	return_portal.portal_label = "Return to Sanctuary"
	return_portal.position = Vector3(0.0, 1.0, origin_z + 3.0)
	_dynamic_content_root.add_child(return_portal)

	# Tempatkan pemain di titik aman (tengah map / dekat portal keluar)
	var player: Node3D = get_tree().root.find_child("Player3D", true, false) as Node3D
	if player != null:
		player.global_position = Vector3(0.0, 0.2, origin_z + 6.0)

	if EventBus != null:
		EventBus.map_loaded.emit(str(map_data.get("map_id", "pgc_dungeon")))

func _setup_torch_lights(parent: Node) -> void:
	var torch_positions: Array[Vector3] = [
		Vector3(-4.5, 3.2, -11.0),
		Vector3(4.5, 3.2, -11.0),
		Vector3(-6.5, 2.2, -3.5),
		Vector3(6.5, 2.2, -3.5)
	]

	var wood_mat: StandardMaterial3D = StandardMaterial3D.new()
	wood_mat.albedo_color = Color(0.35, 0.22, 0.12)

	var flame_mat: StandardMaterial3D = StandardMaterial3D.new()
	flame_mat.albedo_color = Color(1.0, 0.65, 0.15)
	flame_mat.emission_enabled = true
	flame_mat.emission = Color(1.0, 0.45, 0.1)
	flame_mat.emission_energy_multiplier = 3.5

	for pos: Vector3 in torch_positions:
		var torch_holder: Node3D = Node3D.new()
		torch_holder.position = pos
		parent.add_child(torch_holder)

		var stick: MeshInstance3D = MeshInstance3D.new()
		var cyl: CylinderMesh = CylinderMesh.new()
		cyl.top_radius = 0.08
		cyl.bottom_radius = 0.05
		cyl.height = 0.65
		stick.mesh = cyl
		stick.material_override = wood_mat
		torch_holder.add_child(stick)

		var flame: MeshInstance3D = MeshInstance3D.new()
		var sphere: SphereMesh = SphereMesh.new()
		sphere.radius = 0.14
		sphere.height = 0.28
		flame.mesh = sphere
		flame.position = Vector3(0.0, 0.38, 0.0)
		flame.material_override = flame_mat
		torch_holder.add_child(flame)

		var light: OmniLight3D = OmniLight3D.new()
		light.light_color = Color(1.0, 0.68, 0.32)
		light.light_energy = 2.2
		light.omni_range = 9.5
		light.position = Vector3(0.0, 0.45, 0.0)
		torch_holder.add_child(light)

func _decorate_with_gltf_props(parent: Node) -> void:
	_spawn_prop_or_fallback("res://assets/models/dungeon/chest_gold.glb", Vector3(-3.8, 1.0, -9.5), Vector3(0.0, deg_to_rad(25.0), 0.0), parent)
	_spawn_prop_or_fallback("res://assets/models/dungeon/chest.glb", Vector3(3.8, 1.0, -9.5), Vector3(0.0, deg_to_rad(-25.0), 0.0), parent)
	_build_castle_walls(parent)

func _spawn_prop_or_fallback(path: String, pos: Vector3, rot: Vector3, parent: Node) -> void:
	if ResourceLoader.exists(path):
		var packed: PackedScene = load(path) as PackedScene
		if packed != null:
			var inst: Node3D = packed.instantiate() as Node3D
			inst.position = pos
			inst.rotation = rot
			parent.add_child(inst)

func _build_castle_walls(parent: Node) -> void:
	var stone_wall_mat: StandardMaterial3D = StandardMaterial3D.new()
	stone_wall_mat.albedo_color = Color(0.28, 0.27, 0.32)
	stone_wall_mat.roughness = 0.85

	var trim_gold_mat: StandardMaterial3D = StandardMaterial3D.new()
	trim_gold_mat.albedo_color = Color(0.65, 0.52, 0.24)
	trim_gold_mat.metallic = 0.5
	trim_gold_mat.roughness = 0.4

	var back_wall: CSGBox3D = CSGBox3D.new()
	back_wall.size = Vector3(16.0, 4.5, 1.2)
	back_wall.position = Vector3(0.0, 2.25, -13.5)
	back_wall.use_collision = true
	back_wall.material = stone_wall_mat
	parent.add_child(back_wall)

	for z_pos: float in [-8.0, -2.0, 4.0, 10.0]:
		for side: float in [-1.0, 1.0]:
			var col_base: CSGBox3D = CSGBox3D.new()
			col_base.size = Vector3(1.4, 0.6, 1.4)
			col_base.position = Vector3(side * 9.5, 0.3, z_pos)
			col_base.use_collision = true
			col_base.material = stone_wall_mat
			parent.add_child(col_base)

			var col_shaft: CSGCylinder3D = CSGCylinder3D.new()
			col_shaft.radius = 0.5
			col_shaft.height = 4.2
			col_shaft.sides = 8
			col_shaft.position = Vector3(side * 9.5, 2.4, z_pos)
			col_shaft.use_collision = true
			col_shaft.material = stone_wall_mat
			parent.add_child(col_shaft)

			var col_ring: CSGCylinder3D = CSGCylinder3D.new()
			col_ring.radius = 0.62
			col_ring.height = 0.25
			col_ring.sides = 8
			col_ring.position = Vector3(side * 9.5, 4.4, z_pos)
			col_ring.material = trim_gold_mat
			parent.add_child(col_ring)
