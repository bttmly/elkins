(function ( global ) {

  var RAW_GIT = "https://rawgit.com/";
  var CF = "http://cdnjs.cloudflare.com/ajax/libs/";

  function diffKeys ( keysA, keysB ) {
    var obj = keysA.reduce( function ( o, key ) {
      o[key] = 1;
      return o;
    }, {} );
    return keysB.filter( function ( key ) {
      return !obj[key];
    });
  }

  function fileExt ( str ) {
    var i = [].lastIndexOf.call( str, "." );
    if ( i > -1 ) {
      return str.slice( i + 1 );
    }
    return null;
  }

  function httpGet ( url, cb ) {
    cb = cb || noop;
    var req = new XMLHttpRequest();
    req.open( "GET", url );
    req.onreadystatechange = function () {
      if ( req.readyState === 4 ) {
        cb( null, req.response );
      }
    };
    req.send();
  }

  function injectCss ( href ) {
    var link = document.createElement( "link" );
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild( link );
  }

  function injectJs ( src, cb ) {
    cb = cb || noop;
    var script;

    function cleanup () {
      document.body.removeChild( script );
      script = null;
    }

    var prevGlobals = Object.keys( global );
    script = document.createElement( "script" );
    script.src = src;

    script.onload = function () {
      var diff = diffKeys( prevGlobals, Object.keys( global ) );
      scriptSuccess({ src: src, diff: diff });
      cb();
      cleanup();
    };
    script.onerror = function () {
      cleanup();
      scriptError( src );
      cb();
    };
    document.body.appendChild( script );
  }

  function scriptError ( src ) {
    throw new Error( "Script failed to load at " + src );
  }

  function scriptSuccess ( data ) {
    console.log( "Script loaded at " + data.src );
    if ( data.diff ) {
      console.log( "Globals created: " + ( data.diff.length ? data.diff.join( ", " ) : "NONE" ) );
    }
  }

  function noop () {}

  function getResource ( url, cb ) {
    var ext = fileExt( url );
    if ( ext === "js" ) {
      injectJs( url, cb );
    } else if ( ext === "css" ) {
      injectCss( url, cb );
    } else {
      throw new Error( "No method for resource " + url );
    }
  }

  function library ( name, cb ) {
    cb = cb || noop;
    if ( libs[name] ) {
      if ( Array.isArray( libs[name] ) ) {
        return libs[name].forEach( getResource );
      }
      if ( typeof libs[name] === "string" ) {
        return getResource( libs[name] );
      }
    } else {
      cb( new Error( name + " not found. Open a pull request." ), null );
    }
  }

  function ghPath ( path ) {
    var src = RAW_GIT + path;
    injectJs( src );
  }

  function bower ( repo, cb ) {
    var pieces = repo.split( "/" );
    var user = pieces[0];
    var name = pieces[1];
    var branch = pieces[2] || "master";
    var path = [user, name, branch, ""].join( "/" );
    httpGet( RAW_GIT + path + "bower.json", function ( err, resp ) {
      if ( err ) {
        cb( "Failed to find bower.json" );
      }
      console.log( "bower.json loaded" );
      var main = JSON.parse( resp ).main;
      if ( main.charAt( 0 ) === "." ) {
        main = main.slice( 1 );
      }
      var src = ( RAW_GIT + path + main );
      injectJs( src, cb );
    });
  }

  var libs = {
    jquery: "https://code.jquery.com/jquery-1.11.1.min.js",
    underscore: CF + "underscore.js/1.7.0/underscore-min.js",
    lodash: CF + "lodash.js/2.4.1/lodash.min.js",
    backbone: CF + "backbone.js/1.1.2/backbone-min.js",
    angular: CF + "angular.js/1.2.20/angular.min.js",
    ember: CF + "ember.js/1.7.0/ember.min.js",
    react: CF + "react/0.11.2/react.min.js",
    moment: CF + "moment.js/2.8.3/moment.min.js",
    d3: CF + "d3/3.4.11/d3.min.js",
    bootstrap: [
      "http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css",
      "http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"
    ]
  };

  Object.keys( libs ).forEach( function ( key ) {
    library[key] = function ( cb ) {
      return library( key, cb );
    };
  });

  var Elkins = {
    lib: library,
    ghPath: ghPath,
    bower: bower,
  };

  // necessary? Probably not
  if ( typeof module !== "undefined" ) {
    module.exports = Elkins;
  } else {
    global.Elkins = Elkins;
  }

})( this );
