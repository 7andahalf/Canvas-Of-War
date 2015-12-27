function create_box(world, x, y, width, height, options) 
{
	options = $.extend(true, {
		'density' : 1.0 ,
		'friction' : 1.0 ,
		'restitution' : 0.0 ,
		
		'linearDamping' : 0.0 ,
		'angularDamping' : 0.0 ,
		
		'gravityScale' : 1.0 ,
		'type' : b2Body.b2_dynamicBody , 
		
		'fixedRotation' : false ,
	}, options);
	
	var body_def = new b2BodyDef();
	var fix_def = new b2FixtureDef;
	
	fix_def.density = options.density;
	fix_def.friction = options.friction;
	fix_def.restitution = options.restitution;
	
	fix_def.shape = new b2PolygonShape();

	fix_def.userData = options.userData;

	fix_def.shape.SetAsBox( width /2 , height /2 );
	
	body_def.position.Set(x , y);
	body_def.linearDamping = options.linearDamping;
	body_def.angularDamping = options.angularDamping;
	
	body_def.type = options.type;
	
	var b = world.CreateBody( body_def );
	var f = b.CreateFixture(fix_def);
	
	return b;
}
function draw_shape(body , shape, context) 
{
	context.strokeStyle = '#000';
	context.lineWidth = 1;
	var scale = global_game.scale;
	
	context.fillStyle = "#ccc";
	
	context.beginPath();
	switch (shape.GetType()) 
	{
		case b2Shape.e_polygonShape:
		{
			var vert = shape.GetVertices();
			var position = body.GetPosition();
			
			var tV = position.Copy();
			var a = vert[0].Copy();
			a.MulM( body.GetTransform().R );
			
			tV.Add(a);
			
			var _v = global_game.get_offset(tV);
			
			var _x = _v.x;
			var _y = _v.y;
			
			context.moveTo(_x * scale, _y * scale);
			
			for (var i = 0; i < vert.length; i++) 
			{
				var v = vert[i].Copy();
				v.MulM( body.GetTransform().R );
				
				v.Add(position);
				
				var _v = global_game.get_offset(v);
				
				var _x1 = _v.x;
				var _y1 = _v.y;

				context.lineTo( _x1 * scale , _y1  * scale);
			}
			context.lineTo(_x * scale, _y * scale);
		}
		break;
	}
	
	context.fill();
	context.stroke();
}

function draw_body(b, context)
{
	var c_x = b.GetWorldCenter().x;
	var c_y = b.GetWorldCenter().y;
	
	for( var f = b.GetFixtureList() ; f != null ; f = f.GetNext())
	{
		var shape = f.GetShape();
		draw_shape(b , shape , context);
	}
}
