// TODO don't assume jquery
// TODO don't assume JSON
// TODO fix indentation

$(function() {
    // TODO marimo object to store state; don't tie stuff to DOM
    var bulk = {};
    $('div.marimo').each(function() {
      // care about url and json data
      var url = $(this).attr('data-murl');
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

    function handle_bulk(data, text_status) {
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
