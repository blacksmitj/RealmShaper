class_name DynamicTextureLoader
extends RefCounted
## Dynamic Texture Loader untuk memuat dan memvalidasi sprite/tekstur kosmetik komunitas secara runtime.
## Menyimpan cache di memori lokal agar hemat alokasi dan cepat.

static var _texture_cache: Dictionary = {}

## Memuat ImageTexture dari path file lokal atau cache
static func load_local_texture(file_path: String) -> ImageTexture:
	if _texture_cache.has(file_path):
		return _texture_cache[file_path]
		
	if not FileAccess.file_exists(file_path):
		return null
		
	var img: Image = Image.load_from_file(file_path)
	if img == null or img.is_empty():
		return null
		
	var tex: ImageTexture = ImageTexture.create_from_image(img)
	_texture_cache[file_path] = tex
	return tex

## Membuat placeholder sprite texture prosedural (misal untuk item baru dari server)
static func create_colored_icon(size: Vector2i, color: Color) -> ImageTexture:
	var cache_key: String = "procedural_%d_%d_%s" % [size.x, size.y, color.to_html()]
	if _texture_cache.has(cache_key):
		return _texture_cache[cache_key]
		
	var img: Image = Image.create(size.x, size.y, false, Image.FORMAT_RGBA8)
	img.fill(color)
	var tex: ImageTexture = ImageTexture.create_from_image(img)
	_texture_cache[cache_key] = tex
	return tex

