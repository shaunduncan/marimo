// TODO don't assume jquery
// TODO don't assume JSON

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

    function handle_bulk(data, text_status) {
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
