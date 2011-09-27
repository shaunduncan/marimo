// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation
function Widget(data) {
    // TODO div_id -> widget_id
    this.id = data.div_id;
    // TODO write
    this.args = data;
    this.data = {};
}

Widget.prototype.update = function(data) {
    // merge data with this's
    // TODO make this proper update, for now overwrite
    console.log(data)
    this.data = data;
    this.render();
    // TODO future excitement
};

Widget.prototype.render = function() {
    // TODO support a template_url
    // TODO make not-mustache-specific
    console.log(this.data)
    var html = Mustache.to_html(this.data.template, this.data.context);
    $('#'+this.id).html(html);
};


function BatchRequest(url) {
    this.payloads = [];
    this.url = url;
};

BatchRequest.prototype.add = function(payload) {
    // TODO make more resilient/less trusting in the face of corrupted div_ids etc
    this.payloads.push(payload);
};

BatchRequest.prototype.make_request = function(cb) {
   var that = this;
   console.log("making request")
   $.ajax(this.url, {
     data: {bulk:JSON.stringify(this.payloads)},
     dataType: 'json',
     success: function(data) { cb(that.url, data); },
     error: function() {
       console.log('error processing bulk request '+this.url+' with json '+JSON.stringify(this.payloads));
     }
   });
};


function Marimo() {
    this.requests = {};
    this.widgets = {};
    this.widgets_in = 0;
}

Marimo.prototype.add_widget = function(widget_args) {
    console.log('adding widget: '+widget_args);
    // TODO lock request objs while they are making a request
    this.widgets_in++;
    var that = this;
    setTimeout(function() {
        var url = widget_args.murl;
        if (!that.requests[url]) {
            that.requests[url] = new BatchRequest(url);
        }
        that.requests[url].add(widget_args);
        var widget = new Widget(widget_args);
        that.widgets[widget.id] = widget;
        that.widgets_in--;
   }, 1);
};

Marimo.prototype.make_request = function() {
    if (this.widgets_in > 0) {
        console.log('NOT DONE COLLECTING WIDGET URLS');
        var that = this;
        setTimeout(function() { that.make_request() }, 100);
        return;
    }
    console.log('making requests');
    for (var key in this.requests) {
        if (!this.requests.hasOwnProperty(key)) { return; }
        var batch = this.requests[key];
        var that = this;
        batch.make_request(function(url, data) { that.handle_response(url, data) });
    }
};

Marimo.prototype.handle_response = function(url, data) {
    console.log("handling")
    console.log(url)
    console.log(data)
    delete this.requests[url];
    for (var datum in data) {
        if (!data.hasOwnProperty(datum)) {return}
        var widget_data = data[datum];
        console.log('WIDGET DATA :' + widget_data);
        this.widgets[widget_data.div_id].update(widget_data);
    }
    // tell widgets to update based on what is in data.
};

var marimo = new Marimo();

$(function() {
    console.log('ON READY');
    marimo.make_request();
});
