// Simple, internal Object.assign() polyfill for options objects etc.

module.exports = Object.assign != null ? Object.assign.bind( Object ) : function( tgt, ...srcs ){
  srcs.filter( src => src != null ).forEach( src => {
    Object.keys( src ).forEach( k => tgt[k] = src[k] );
  } );

  return tgt;
};
