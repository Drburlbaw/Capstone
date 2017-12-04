(document).ready(function() {
     ('#uploadForm').submit(function() {
        ("#status").empty().text("File is uploading...");
        (this).ajaxSubmit({
            error: function(xhr) {
          status('Error: ' + xhr.status);
            },
            success: function(response) {
        console.log(response)
            ("#status").empty().text(response);
            }
    });
    return false;
    })
    });    