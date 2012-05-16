//until we have a sane way of dealing with multiple files
//include this after marimo.js it assumes there is a global marimo object
//it also assumes socket.io.js has already been included
//this provides marimo widgets and base functionality for socket.io and browsermq now


//function for scope this will make it harder to extend probably
function rt_wrap() {
  // should this be a proper object?
  var realtime = {
    marimo_module : true
  };
  // is this a nasty pattern
  var widgetlib = realtime.widgetlib = {};
  var queues = realtime.queues = {
      // TODO this is kind of a mess the relation between queues and sockets should be fixed
      // FOR NOW EACH QUEUE can only be on one socket
    _queues: {},
    subscribe: function(qstring, socket, handler){
      console.log("trying to sub")
      console.log(qstring);
      console.log(socket);
      console.log(handler);
      if(!this._queues[qstring]){
        this._queues[qstring] = {socket: socket};
      };
      console.log(this._queues[qstring])
      socket = this._queues[qstring].socket
      // set up the handler
      socket.on(qstring, handler)
      // when ever we subscribe make sure the server is listening to the queue
      // TODO fix this
      socket.emit('subscribe_queue', qstring);
      return this._queues.qstring;
    }
  };
  var sockets = realtime.sockets = {
    _sockets: {},
    get_socket: function (path){
       if(this._sockets[path]){
         return this._sockets[path];
      };
      return this.add_socket(path);
    },
    add_socket: function(path){
        this._sockets[path] = io.connect(path);
        return this._sockets[path];
    },
  };

  widgetlib.browsermq = marimo.extend(marimo.widgetlib.base_widget, {
    /*
     * this wisget is the base for browsermq stuff some of this belongs
     * in a socket_io_widget and can be refactored when there is need to
     * the init for this expects the following data
     *   id = the widgets id
     *   socket_path = the path to the socket it should connect to
     *   queues = a list of queue strings that this widget should listen to
     *   template = the mustache template that should be used to render this
    */
    init: function(data) {
      this.id = data.id;
      this.template = data.template;
      this.queues = data.queues;
      this.data = data;
      this.socket = sockets.get_socket(data.socket_path);
      //loop over all the queues and subscribe to them
      for (i=0;i<data.queues.length;i++) { this.subscribe(data.queues[i]);}
    },
    subscribe: function(qname){
      that = this;
      var handler = function(message){return that.on_message.apply(that, [message, qname]);}
      realtime.queues.subscribe(qname, this.socket, handler);
    },
    //browsermq widgets really only get context in their messages now
    //the base widget will just overwrite data.context with this
    update: function(message){
      if(this.transform) {
        this.data.context = this.transform(message);
      } else {
      this.data.context = message;
      }
    },
    on_message: function(message, qname){
      message = message;
      console.log("widget: " + this.id + "\nqueue: " + qname + "\nmessage: " + message);
      console.log(message);
      this.update(message);
      this.render();
    },
    render: function () {
        // this is just copied from the request widget for now
        var html = Mustache.to_html(this.data.template, this.data.context)

        var that = this
        marimo.$(function() {
            marimo.$('#'+that.id).html(html).show()
        })
    },
  });
  marimo.realtime = realtime;
};
rt_wrap();
marimo.widgetlib.browsermq = marimo.realtime.widgetlib.browsermq;
