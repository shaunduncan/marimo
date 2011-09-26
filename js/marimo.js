// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation
function Widget(data) {
    // TODO write
}
function Marimo() {
    this.requests = {};
    this.widgets = {};
}
Marimo.prototype.add_widget = function(widget_data) {
    var widget = new Widget(widget_data);
    if (!this.requests[widget.murl]) {
        this.requests[widget.murl] = [widget];
    }
    else {
        this.requests[widget.murl].push(widget);
    }
};

Marimo.prototype.bulk_request = function(requests) {
    requests = requests || this.requests;
    for (var url in requests) {
        if (!requests.hasOwnProperty(url)) { return; }
        $.ajax(url, {
          data: {bulk:requests[url]},
          dataType: 'json',
          success: this.handle_bulk,
          error: function() {
            console.log('error processing bulk request '+url+' with json '+JSON.stringify(requests[url]));
          }
        });
    }
};

Marimo.prototype.handle_bulk = function(data) {
      for (var key in data) {
        if (!data.hasOwnProperty(key)) {return;}    
        var widget_json = data[key];
        var widget = new Widget(JSON.parse(widget_json));
        render(widget, function(err, html) {
            // TODO pay attention to err
            var div_id = widget.div_id;
            $('#'+div_id).html(html);
        });
      }
};

var marimo = new Marimo();

$(function() {
    // we have marimo this.widgets
    // TODO marimo object to store state; don't tie stuff to DOM
    var bulk = {};
    $('div.marimo').each(function() {
      // care about url and json data
      var url = $(this).attr('data-murl');
      console.log('encoded: ' + $(this).attr('data-json'));
      console.log('decoded: ' + decodeURI($(this).attr('data-json')));
      console.log('parsed: ' + JSON.parse(decodeURI($(this).attr('data-json'))));
      var widget = {
        json: decodeURI($(this).attr('data-json')),
        div: this
      };
      // TODO what if data-* doesn't exist? check and skip the div
      if (!bulk[url]) {
        bulk[url] = [];
      }
      else {
        bulk[url].push(widget);
      }
    });

    // TODO give obj a meaningful name
    function render(obj, cb) {
        // TODO accept a render function that will override finish()
        // template
        // template_url
        // context
        function finish(template, context, cb) {
            // TODO make not-mustache-specific
            var html = Mustache.to_html(template, context);
            cb(null, html);
        }
        if (obj.template_url) {
            // fetch, pass finish as callback
        }
        else { finish(obj.template, obj.context, cb); }
    }

    function handle_bulk(data) {
      // data is json
      for (var key in data) {
        if (!data.hasOwnProperty(key)) {return;}    
        var widget = data[key];
        render(widget, function(err, html) {
            // TODO pay attention to err
            var div_id = widget.div_id;
            $('#'+div_id).html(html);
        });
      }
    }

    for (var url in bulk) {
      if (!bulk.hasOwnProperty(url)) { return; }
      var widgets_json = JSON.stringify(bulk[url]);
      // TODO x-domain?
      $.ajax(url, {
        data: {bulk:widgets_json},
        dataType: 'json',
        success: handle_bulk,
        error: function() {
          console.log('error processing bulk request '+url+' with json '+widgets_json);
        }
      });
    }
});
