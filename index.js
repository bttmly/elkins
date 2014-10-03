(function ( global ) {

  var RAW_GIT = "https://rawgit.com/";

  function diffKeys ( keysA, keysB ) {
    var obj = keysA.reduce( function ( o, key ) {
      o[key] = 1;
      return o;
    }, {} );
    return keysB.filter( function ( key ) {
      return !obj[key]
    })
  }

  function fileExt ( str ) {
    var i = [].lastIndexOf.call( str, "." );
    if ( i > -1 ) {
      return str.slice( i + 1 );
    }
    return null;
  }

  function injectCss ( href ) {
    var link = document.createElement( "link" );
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild( link );
  }

  function httpGet ( url, success, fail ) {
    var req = new XMLHttpRequest();
    req.open( "GET", url );
    req.onreadystatechange = function () {
      if ( req.readyState === 4 ) {
        success( req.response );
      }
    }
    req.send();
  }

  function injectJs ( src, success, fail ) {
    var script;
    function cleanup () {
      document.body.removeChild( script );
      script = null;
    }

    var prevGlobals = Object.keys( window );

    script = document.createElement( "script" );
    script.src = src;
    script.onload = function () {
      var diff = diffKeys( prevGlobals, Object.keys( window ) );
      if ( success ) {
        success( src, diff );
      }
      cleanup();
    };
    script.onerror = function () {
      if ( fail ) {
        fail( src );
      }
      cleanup();
    };
    document.body.appendChild( script );
  }

  function scriptError ( src ) {
    throw new Error( "Script failed to load at " + src );
  }

  function scriptSuccess ( src, diff ) {
    console.log( "Script loaded at " + src );
    if ( diff ) {
      console.log( "Globals created: " + diff.length ? diff.join( ", " ) : "NONE" );
    }
  }

  function getResource ( url, success, fail ) {
    var ext = fileExt( url );
    if ( ext === "js" ) {
      fetchScript( url, success, fail );
    } else if ( ext === "css" ) {
      injectCss( url );
    } else {
      throw new Error( "No method for resource " + url );
    }
  }

  function library ( name ) {
    if ( libs[name] ) {
      if ( Array.isArray( libs[name] ) ) {
        return libs[name].forEach( Elkins.library );
      }
      if ( typeof libs[name] === "string" ) {
        return getResource( libs[name], scriptSuccess, scriptError );
      }
      libs[name].forEach( function ( str ) {
        getResource( str, scriptSuccess, scriptError );
      });
    } else {
      throw new Error( name + " not found. Open a pull request." );
    }
  }

  function ghPath ( path ) {
    var src = RAW_GIT + path;
    injectJs( src, scriptSuccess, scriptError );
  }

  function bower ( repo ) {
    var pieces = repo.split( "/" );
    var user = pieces[0];
    var name = pieces[1];
    var branch = pieces[2] || "master";
    var path = [user, name, branch].join( "/" );
    httpGet( RAW_GIT + path + "/bower.json", function ( resp ) {
      var json = JSON.parse( resp );
      console.log( "bower.json loaded" );
      var main = json.main;
      if ( main.charAt( 0 ) === "." ) {
        main = main.slice( 1 );
      }
      var src = ( RAW_GIT + path + main );
      injectJs( src, scriptSuccess, scriptError );
    })
  }

  var libs = {
    jquery: "https://code.jquery.com/jquery-1.11.1.min.js",
    underscore: "http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js",
    lodash: "http://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min.js",
    backbone: "http://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min.js",
    angular: "http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.min.js",
    ember: "http://cdnjs.cloudflare.com/ajax/libs/ember.js/1.7.0/ember.min.js",
    react: "http://cdnjs.cloudflare.com/ajax/libs/react/0.11.2/react.min.js",
    moment: "http://cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.3/moment.min.js",
    d3: "http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.11/d3.min.js",
    bootstrap: [
      "http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css",
      "http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"
    ]
  }

  var Elkins = {
    library: library
    ghPath: ghPath
    bower: bower
  };

  if ( typeof module !== "undefined" ) {
    module.exports = Elkins;
  } else {
    global.Elkins = Elkins;
  }

})( this );

