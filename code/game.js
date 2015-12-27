var global_game = null;

$(function() { 
    start_game();
});

function start_game()
{
    var g = new game();

    global_game = g;

    
    $(window).resize(function() {
        g.resize();
    });
    g.start();
}

function game()
{
    this.fps = 60;
    this.scale = 20;

    this.game_objects = [];
    
    this.points = 0;
    this.to_destroy = [];
    this.time_elapsed = 0;
}

game.prototype.resize = function()
{
    var canvas = this.canvas;

    var w = $(window).outerWidth();
    var h = $(window).outerHeight();
    
    canvas.width(w);
    canvas.height(h);
    
    canvas.attr('width' , w * 0.75);
    canvas.attr('height' , h * 0.75);
    
    this.canvas_width = canvas.attr('width');
    this.canvas_height = canvas.attr('height');
    
    this.screen_height = 26;
    this.scale = this.canvas_height / this.screen_height;
    this.screen_width = this.canvas_width / this.scale;
}

game.prototype.setup = function()
{
    this.ctx = ctx = $('#canvas').get(0).getContext('2d');
    var canvas = $('#canvas');
    this.canvas = canvas;

    this.resize();

    var w = this.screen_width;
    var h = this.screen_height;

    this.create_box2d_world();

    
    this.world = this.box2d_world;
    this.element = canvas;
    this.context = ctx;
    //global_game.scale = 10;
    this.context.scale(global_game.scale,global_game.scale);

    this.game_objects.push(new Body(global_game, { color: "red", type: "static", x: 0, y: 0, height: 50,  width: 0.5 }));
    this.game_objects.push(new Body(global_game, { color: "red", type: "static", x:51, y: 0, height: 50,  width: 0.5}));
    this.game_objects.push(new Body(global_game, { color: "red", type: "static", x: 0, y: 0, height: 0.5, width: 120 }));
    this.game_objects.push(new Body(global_game, { color: "red", type: "static", x: 0, y: 25, height: 0.5, width: 120 }));


    this.player = new player(global_game, { image: img_res('man.png'), x: 5, y: 8, width: 2.6 });
    this.gun = new gun(global_game, { image: img_res('gun.png'), x: 6, y: 8.5, width: 4 , height: 1.5})

    //this.player = new player(global_game, { color: "red", x: 5, y: 8, width: 2.6 });
    //this.gun = new Body(global_game, {color: "blue", x: 7, y: 8, width: 4 , height: 1.5})

    this.game_objects.push(this.player);
    this.game_objects.push(this.gun);

    def = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
    def.Initialize(this.player.body,
                   this.gun.body,
                   new b2Vec2(5,8.5));
    var joint = this.world.CreateJoint(def);

    this.start_handling();
    this.setup_collision_handler();
}

game.prototype.create_box2d_world = function()
{
    var gravity = new b2Vec2(0, 2);
    var doSleep = false;
    var world = new b2World(gravity , doSleep);
    
    this.box2d_world = world;
}

game.prototype.start = function()
{
    this.on = true;
    this.total_points = 0;
    
    this.setup();
    this.is_paused = false;

    this.tick();
}

game.prototype.redraw_world = function()
{
        
    //this.ctx.clearRect(0 , 0 , this.canvas_width , this.canvas_height);

    var w = this.screen_width;
    var h = this.screen_height;

    for(var i in this.game_objects)
    {
        this.game_objects[i].draw(this.ctx);
    }
}

game.prototype.tick = function(cnt)
{
    ctx.save()
    this.ctx.translate(0,0.1);
    ctx.restore()
    this.ctx.clearRect(0 , 0 , this.canvas_width , this.canvas_height);

    if(!this.is_paused && this.on)
    {
        this.time_elapsed += 1;

        for(var i in this.game_objects)
          {
            if(this.game_objects[i].dead == true)
            {
              delete this.game_objects[i];
              continue;
            }
            
            this.game_objects[i].tick();
          }
        this.perform_destroy();

        this.box2d_world.Step(1/20 , 8 , 3);

        this.box2d_world.ClearForces();

        this.redraw_world();
        
        if(!this.is_paused && this.on)
        {
            var that = this;
            this.timer = setTimeout( function() { that.tick(); }  , 1000/this.fps);
        }


        
    }
}

game.prototype.perform_destroy = function()
{
  for(var i in this.to_destroy)
  {
    this.to_destroy[i].destroy();
  }
}


game.prototype.get_offset = function(vector)
{
    return new b2Vec2(vector.x - 0, Math.abs(vector.y - this.screen_height));
}

game.prototype.destroy_object = function(obj)
{
  this.to_destroy.push(obj);
}

// BODY

var Body = window.Body = function(physics,details) {
    this.details = details = details || {};

    this.definition = new b2BodyDef();
    this.age = 0;
    this.tp = "wall";
    for(var k in this.definitionDefaults) {
      this.definition[k] = details[k] || this.definitionDefaults[k];
    }
    this.definition.position = new b2Vec2(details.x || 0, details.y || 0);
    this.definition.linearVelocity = new b2Vec2(details.vx || 0, details.vy || 0);
    this.definition.userData = this;
    this.definition.type = details.type == "static" ? b2Body.b2_staticBody :
                                                      b2Body.b2_dynamicBody;


    this.body = physics.world.CreateBody(this.definition);


    this.fixtureDef = new b2FixtureDef();
    this.fixtureDef.userData = this;
    for(var l in this.fixtureDefaults) {
      this.fixtureDef[l] = details[l] || this.fixtureDefaults[l];
    }


    details.shape = details.shape || this.defaults.shape;

    switch(details.shape) {
      case "circle":
        details.radius = details.radius || this.defaults.radius;
        this.fixtureDef.shape = new b2CircleShape(details.radius);
        break;
      case "polygon":
        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsArray(details.points,details.points.length);
        break;
      case "block":
      default:
        details.width = details.width || this.defaults.width;
        details.height = details.height || this.defaults.height;

        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsBox(details.width/2,
                                       details.height/2);
        break;
    }

    this.body.CreateFixture(this.fixtureDef);
  };


  Body.prototype.defaults = {
    shape: "block",
    width: 4,
    height: 4,
    radius: 1
  };

  Body.prototype.fixtureDefaults = {
    density: 0,
    friction: 2,
    restitution: 0.2
  };

  Body.prototype.definitionDefaults = {
    active: true,
    allowSleep: true,
    angle: 0,
    angularVelocity: 0,
    awake: true,
    bullet: false,
    fixedRotation: false
  };


  Body.prototype.draw = function(context) {
    if(this.body == null){return;}
    var pos = this.body.GetPosition(),
        angle = this.body.GetAngle();

    context.save();
    context.translate(pos.x,pos.y);
    context.rotate(angle);


    if(this.details.color) {
      context.fillStyle = this.details.color;

      switch(this.details.shape) {
        case "circle":
          context.beginPath();
          context.arc(0,0,this.details.radius,0,Math.PI*2);
          context.fill();
          break;
        case "polygon":
          var points = this.details.points;
          context.beginPath();
          context.moveTo(points[0].x,points[0].y);
          for(var i=1;i<points.length;i++) {
            context.lineTo(points[i].x,points[i].y);
          }
          context.fill();
          break;
        case "block":
          context.fillRect(-this.details.width/2,
                           -this.details.height/2,
                           this.details.width,
                           this.details.height);
        default:
          break;
      }
    }

    if(this.details.image) {
      context.drawImage(this.details.image,
                        -this.details.width/2,
                        -this.details.height/2,
                        this.details.width,
                        this.details.height);

    }
    context.translate(-pos.x,-pos.y);
    context.restore();

  }

  Body.prototype.tick = function()
{
    this.age++;
}

Body.prototype.add_velocity = function(vel)
{
    var b = this.body;
    var v = b.GetLinearVelocity();
    
    v.Add(vel);
    
    if(Math.abs(v.y) > this.max_ver_vel)
    {
        v.y = this.max_ver_vel * v.y/Math.abs(v.y);
    }
    
    if(Math.abs(v.x) > this.max_hor_vel)
    {
        v.x = this.max_hor_vel * v.x/Math.abs(v.x);
    }

    b.SetLinearVelocity(v);
}

Body.prototype.destroy = function()
{
  if(this.body == null)
  {
    return;
  }
  this.body.GetWorld().DestroyBody( this.body );
  this.body = null;
  this.dead = true;
}


  game.prototype.start_handling = function()
{
    var that = this;
    
    $(document).on('keydown.game' , function(e)
    {
        that.key_down(e);
        return false;
    });
    
    $(document).on('keyup.game' ,function(e)
    {
        that.key_up(e);
        return false;
    });
}

game.prototype.key_down = function(e)
{
    var code = e.keyCode;
    //alert(code);

    if(code == 37 || code == 65)
    {
        this.player.do_move_left = true;
    }

    else if(code == 38 || code == 87)
    {
        this.player.do_move_up = true;
    }

    else if(code == 39 || code == 68)
    {
        this.player.do_move_right = true;
    }
    else if(code == 32)
    {
        global_game.gun.shoot();
    }

}

game.prototype.key_up = function(e)
{
    var code = e.keyCode;
    

    if(code == 38 || code == 87)
    {
        this.player.do_move_up = false;
    }

    else if(code == 37 || code == 65)
    {
        this.player.do_move_left = false;
    }

    else if(code == 39 || code == 68)
    {
        this.player.do_move_right = false;
    }
}

game.prototype.setup_collision_handler = function()
{
  var that = this;

  b2ContactListener.prototype.BeginContact = function (contact) 
  {

    var a = contact.GetFixtureA().GetUserData();
    var b = contact.GetFixtureB().GetUserData();
    if(a instanceof Body && b instanceof Body)
    {
      if(a.tp == "bullet"){that.destroy_object(a);}
      else if(b.tp == "bullet"){that.destroy_object(b);}
    }
  }
}

// PLAYER

var player = function(physics,details) {
    this.details = details = details || {};

    this.definition = new b2BodyDef();

    for(var k in this.definitionDefaults) {
      this.definition[k] = details[k] || this.definitionDefaults[k];
    }
    this.definition.position = new b2Vec2(details.x || 0, details.y || 0);
    this.definition.linearVelocity = new b2Vec2(details.vx || 0, details.vy || 0);
    this.definition.userData = this;
    this.definition.type = details.type == "static" ? b2Body.b2_staticBody :
                                                      b2Body.b2_dynamicBody;

    this.body = physics.world.CreateBody(this.definition);

    this.fixtureDef = new b2FixtureDef();
    for(var l in this.fixtureDefaults) {
      this.fixtureDef[l] = details[l] || this.fixtureDefaults[l];
    }

    this.age = 0;      
    this.do_move_left = false;
    this.do_move_right = false;
    this.max_hor_vel = 2;
    this.max_ver_vel = 2;
    this.can_move_up = true;

    details.shape = details.shape || this.defaults.shape;

    switch(details.shape) {
      case "circle":
        details.radius = details.radius || this.defaults.radius;
        this.fixtureDef.shape = new b2CircleShape(details.radius);
        break;
      case "polygon":
        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsArray(details.points,details.points.length);
        break;
      case "block":
      default:
        details.width = details.width || this.defaults.width;
        details.height = details.height || this.defaults.height;

        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsBox(details.width/2,
                                       details.height/2);
        break;
    }

    this.body.CreateFixture(this.fixtureDef);
  };


  player.prototype.defaults = {
    shape: "block",
    width: 4,
    height: 4,
    radius: 1
  };

  player.prototype.fixtureDefaults = {
    density: 2,
    friction: 0.2,
    restitution: 0.2
  };

  player.prototype.definitionDefaults = {
    active: true,
    allowSleep: true,
    angle: 0,
    angularVelocity: 0,
    awake: true,
    bullet: false,
    fixedRotation: false
  };


  player.prototype.draw = function(context) {
    var pos = this.body.GetPosition(),
        angle = this.body.GetAngle();

    context.save();
    context.translate(pos.x,pos.y);
    context.rotate(angle);


    if(this.details.color) {
      context.fillStyle = this.details.color;

      switch(this.details.shape) {
        case "circle":
          context.beginPath();
          context.arc(0,0,this.details.radius,0,Math.PI*2);
          context.fill();
          break;
        case "polygon":
          var points = this.details.points;
          context.beginPath();
          context.moveTo(points[0].x,points[0].y);
          for(var i=1;i<points.length;i++) {
            context.lineTo(points[i].x,points[i].y);
          }
          context.fill();
          break;
        case "block":
          context.fillRect(-this.details.width/2,
                           -this.details.height/2,
                           this.details.width,
                           this.details.height);
        default:
          break;
      }
    }

    if(this.details.image) {
      context.drawImage(this.details.image,
                        -this.details.width/2,
                        -this.details.height/2,
                        this.details.width,
                        this.details.height);

    }
    context.restore();
  }

player.prototype.tick = function()
{    
    if(this.do_move_left)
    {
        this.add_velocity(new b2Vec2(-1,0));
    }
    
    if(this.do_move_right)
    {
        this.add_velocity(new b2Vec2(1,0));
    }
    
    if(this.do_move_up)
    {
        
        this.add_velocity(new b2Vec2(0,-1));
    }

    if(this.body.GetLinearVelocity().y <= 0.1){
      this.body.SetAngle(0);
    }
    
    this.age++;
}

player.prototype.add_velocity = function(vel)
{
    var b = this.body;
    var v = b.GetLinearVelocity();
    
    v.Add(vel);

    if(Math.abs(v.y) > this.max_ver_vel)
    {
        v.y = this.max_ver_vel * v.y/Math.abs(v.y);
    }
    
    if(Math.abs(v.x) > this.max_hor_vel)
    {
        v.x = this.max_hor_vel * v.x/Math.abs(v.x);
    }

    b.SetLinearVelocity(v);
}


// GUN

var gun = function(physics,details) {
    this.details = details = details || {};

    this.definition = new b2BodyDef();
    this.age = 0;

    for(var k in this.definitionDefaults) {
      this.definition[k] = details[k] || this.definitionDefaults[k];
    }
    this.definition.position = new b2Vec2(details.x || 0, details.y || 0);
    this.definition.linearVelocity = new b2Vec2(details.vx || 0, details.vy || 0);
    this.definition.userData = this;
    this.definition.type = details.type == "static" ? b2Body.b2_staticBody :
                                                      b2Body.b2_dynamicBody;

    this.details.image1 = img_res('rgun.png');
    this.details.image2 = img_res('gun.png');

    this.body = physics.world.CreateBody(this.definition);

    this.fixtureDef = new b2FixtureDef();
    for(var l in this.fixtureDefaults) {
      this.fixtureDef[l] = details[l] || this.fixtureDefaults[l];
    }


    details.shape = details.shape || this.defaults.shape;

    switch(details.shape) {
      case "circle":
        details.radius = details.radius || this.defaults.radius;
        this.fixtureDef.shape = new b2CircleShape(details.radius);
        break;
      case "polygon":
        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsArray(details.points,details.points.length);
        break;
      case "block":
      default:
        details.width = details.width || this.defaults.width;
        details.height = details.height || this.defaults.height;

        this.fixtureDef.shape = new b2PolygonShape();
        this.fixtureDef.shape.SetAsBox(details.width/2,
                                       details.height/2);
        break;
    }

    this.body.CreateFixture(this.fixtureDef);
  };


  gun.prototype.defaults = {
    shape: "block",
    width: 4,
    height: 4,
    radius: 1
  };

  gun.prototype.fixtureDefaults = {
    density: 0,
    friction: 2,
    restitution: 0.2
  };

  gun.prototype.definitionDefaults = {
    active: true,
    allowSleep: true,
    angle: 0,
    angularVelocity: 0,
    awake: true,
    bullet: false,
    fixedRotation: false
  };


  gun.prototype.draw = function(context) {
    var pos = this.body.GetPosition(),
        angle = this.body.GetAngle();

    context.save();
    context.translate(pos.x,pos.y);
    context.rotate(angle);


    if(this.details.color) {
      context.fillStyle = this.details.color;

      switch(this.details.shape) {
        case "circle":
          context.beginPath();
          context.arc(0,0,this.details.radius,0,Math.PI*2);
          context.fill();
          break;
        case "polygon":
          var points = this.details.points;
          context.beginPath();
          context.moveTo(points[0].x,points[0].y);
          for(var i=1;i<points.length;i++) {
            context.lineTo(points[i].x,points[i].y);
          }
          context.fill();
          break;
        case "block":
          context.fillRect(-this.details.width/2,
                           -this.details.height/2,
                           this.details.width,
                           this.details.height);
        default:
          break;
      }
    }

    if(this.details.image) {
      context.drawImage(this.details.image,
                        -this.details.width/2,
                        -this.details.height/2,
                        this.details.width,
                        this.details.height);

    }
    context.restore();
  }

  gun.prototype.tick = function()
{
    $(canvas).mousemove(function(e) 
    {
        scale = global_game.scale * 1.318;
        var pl = global_game.player.body.GetPosition();
        player_x = (pl.x) * scale;
        player_y = (pl.y) * scale;
        this.diffx = player_x-e.pageX;
        this.diffy = player_y-e.pageY;
        if(this.diffx > 0){
            global_game.gun.details.image = global_game.gun.details.image1;
        }else{
            global_game.gun.details.image = global_game.gun.details.image2;
        }
        global_game.gun.body.SetAngle(3.1415 + Math.atan2(this.diffy,this.diffx));
        this.age++;
    });    
}

 gun.prototype.shoot = function()
{
    var pl = global_game.player.body.GetPosition();
    var angle = global_game.gun.body.GetAngle()
    this.bullet = new Body(global_game, { image: img_res('bullet.png'), x: pl.x + (4 * Math.cos(angle)), y: pl.y + (4 * Math.sin(angle)), width: 0.3, height: 0.2});
    this.bullet.tp = "bullet";
    this.bullet.body.SetAngle(angle);
    global_game.game_objects.push(this.bullet);
    this.bullet.add_velocity(new b2Vec2(70 * Math.cos(angle),70 * Math.sin(angle)));
}












