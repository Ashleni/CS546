(function ($) {
  let commentForm    = $('#newComment-form'),
      messageInput   = $('#message'),
      commentList    = $('#comment-list'),
      errorDiv       = $('#error'),
      commentCount   = $('#comment-count'),
      submitBtn      = $('#postMessageButton');

  commentForm.submit(function (event) {
    event.preventDefault();

    errorDiv.hide().text('');
    let message = messageInput.val().trim();

    if (!message) {
      errorDiv.text("Your comment can't be empty!").show();
      messageInput.focus();
      return;
    }
    let repeatingChar = null,
        occurrence    = 1;

    for (let i = 0; i < message.length - 1; i++) {
      let curr = message[i],
          next = message[i + 1];

      if (curr === repeatingChar) {
        occurrence++;
        if (occurrence >= 5) {
          errorDiv.text("Your comment can't have repeating characters!").show();
          messageInput.focus();
          return;
        }
      } else if (curr === next) {
        repeatingChar = curr;
        occurrence    = 2;
      } else {
        repeatingChar = null;
        occurrence    = 1;
      }
    }

    let restaurantId = commentForm.data('restaurant-id'),
        currentUser  = String(commentForm.data('current-user') || ''),
        isAdmin      = commentForm.data('is-admin') === true ||
                       commentForm.data('is-admin') === 'true';

    let requestConfig = {
      method:      'POST',
      url:         commentForm.attr('action'),
      contentType: 'application/x-www-form-urlencoded',
      headers:     { 'X-Requested-With': 'XMLHttpRequest' },
      data:        { message: message }
    };

    submitBtn.prop('disabled', true).text('Posting…');
    $.ajax(requestConfig).then(
      function (responseMessage) {
        console.log(responseMessage);

        if (!responseMessage.success) {
          errorDiv.text(responseMessage.error || 'Failed to post comment.').show();
          return;
        }

        let c = responseMessage.comment;

        function esc(str) {
          return $('<div>').text(String(str)).html();
        }

        let replyForm =
          '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(c._id) + '/reply" method="POST">' +
            '<label>Reply to this comment' +
              '<textarea name="reply" placeholder="What\'s on your mind?"></textarea>' +
            '</label>' +
            '<button type="submit">Post</button>' +
          '</form>';

        let deleteBtn = '';
        if (isAdmin || c.username === currentUser) {
          deleteBtn =
            '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(c._id) + '/delete" ' +
                  'method="POST" style="margin-top:0.4rem">' +
              '<button type="submit">Delete Comment</button>' +
            '</form>';
        }

        let editBtn = '';
        if (c.username === currentUser) {
          editBtn =
            '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(c._id) + '/edit" ' +
                  'method="GET" style="margin-top:0.4rem">' +
              '<button type="submit">Edit Comment</button>' +
            '</form>';
        }

        let newComment = $(
          '<section class="single-comment" id="comment-' + esc(c._id) + '">' +
            '<span><strong><a href="/profile/' + esc(c.username) + '">' + esc(c.username) + '</a></strong></span>' +
            '<span>' + esc(c.date) + '</span>' +
            '<p>' + esc(c.message) + '</p>' +
            replyForm +
            deleteBtn +
            editBtn +
            '<hr>' +
          '</section>'
        );

        $('#no-comments-msg').remove();

        commentList.prepend(newComment);
        commentCount.text((parseInt(commentCount.text(), 10) || 0) + 1);

        messageInput.val('').focus();
      },
      function (xhr) {
        console.log(xhr);
        let msg = 'An error occurred while posting your comment.';
        if (xhr.responseJSON && xhr.responseJSON.error) {
          msg = xhr.responseJSON.error;
        }
        errorDiv.text(msg).show();
      }
    ).always(function () {
      submitBtn.prop('disabled', false).text('Post');
    });
  });

})(window.jQuery);
