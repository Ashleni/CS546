(function ($) {
  let commentForm    = $('#newComment-form'),
      messageInput   = $('#message'),
      commentList    = $('#comment-list'),
      errorDiv       = $('#error'),
      commentCount   = $('#comment-count'),
      submitBtn      = $('#postMessageButton');


  let restaurantId = String(commentForm.data('restaurant-id') || ''),
      currentUser   = String(commentForm.data('current-user') || ''),
      isAdmin       = commentForm.data('is-admin') === true ||
                      commentForm.data('is-admin') === 'true';

  function esc(str) {
    return $('<div>').text(String(str)).html();
  }

  function buildReplyMarkup(reply, commentId) {
    let deleteBtn = '';
    if (reply.username === currentUser) {
      deleteBtn =
        '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(commentId) + '/reply/' + esc(reply._id) + '/delete" method="POST">' +
          '<button type="submit">Delete Reply</button>' +
        '</form>';
    }

    let editBtn = '';
    if (reply.username === currentUser) {
      editBtn =
        '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(reply._id) + '/edit" method="GET">' +
          '<button type="submit">Edit Reply</button>' +
        '</form>';
    }

    let actionRow = (deleteBtn || editBtn)
      ? '<div class="comment-actiosn">' + deleteBtn + editBtn + '</div>'
      : '';

    return $(
      '<li>' +
        '<span><strong><a href="/profile/' + esc(reply.username) + '">' + esc(reply.username) + '</a></strong> | </span>' +
        '<span>' + esc(reply.date) + '</span>' +
        '<p>' + esc(reply.message) + '</p>' +
        actionRow +
      '</li>'
    );
  }

  $(document).on('submit', 'form.reply-form', function (event) {
    event.preventDefault();

    let form = $(this);
    let localError = form.find('.reply-error');
    if (!localError.length) {
      localError = $('<div class="reply-error formError"></div>');
      form.append(localError);
    }

    localError.hide().text('');
    errorDiv.hide().text('');

    let commentId = String(form.data('comment-id') || '');
    let replyInput = form.find('textarea[name="reply"]');
    let replyMessage = String(replyInput.val() || '').trim();

    if (!replyMessage) {
      localError.text("Your reply can't be empty!").show();
      replyInput.focus();
      return;
    }

    let submitButton = form.find('button[type="submit"]').first();
    let requestConfig = {
      method: 'POST',
      url: form.attr('action'),
      contentType: 'application/x-www-form-urlencoded',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      data: { reply: replyMessage }
    };

    submitButton.prop('disabled', true).text('Posting...');

    $.ajax(requestConfig).then(
      function (responseMessage) {
        if (!responseMessage.success) {
          localError.text(responseMessage.error || 'Failed to post reply.').show();
          return;
        }

        let commentSection = $('#comment-' + esc(commentId));
        let repliesDiv = commentSection.find('.replies').first();

        if (!repliesDiv.length) {
          repliesDiv = $(
            '<div class="replies">' +
              '<span><strong>Replies:</strong></span>' +
              '<ul></ul>' +
            '</div>'
          );

          let hr = commentSection.find('hr').first();
          if (hr.length) {
            hr.before(repliesDiv);
          } else {
            commentSection.append(repliesDiv);
          }
        }

        let repliesList = repliesDiv.find('ul').first();
        repliesList.append(buildReplyMarkup(responseMessage.reply, commentId));
        form.get(0).reset();
      },
      function (xhr) {
        let msg = 'An error occurred while posting your reply.';
        if (xhr.responseJSON && xhr.responseJSON.error) {
          msg = xhr.responseJSON.error;
        }
        localError.text(msg).show();
      }
    ).always(function () {
      submitButton.prop('disabled', false).text('Post');
    });
  });

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

        let replyFormId = 'newReply-form-' + esc(c._id);
        let replyForm =
          '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(c._id) + '/reply" method="POST" class="reply-form" data-comment-id="' + esc(c._id) + '" id="' + replyFormId + '">' +
            '<label>Reply to this comment' +
              '<textarea name="reply" placeholder="What\'s on your mind?"></textarea>' +
            '</label>' +
            '<div class="reply-error formError"></div>' +
          '</form>';

        let deleteBtn = '';
        if (isAdmin || c.username === currentUser) {
          deleteBtn =
            '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(c._id) + '/delete" ' +
                  'method="POST">' +
              '<button type="submit">Delete Comment</button>' +
            '</form>';
        }

        let editBtn = '';
        if (c.username === currentUser) {
          editBtn =
            '<form action="/restaurant/' + esc(restaurantId) + '/comment/' + esc(c._id) + '/edit" ' +
                  'method="GET">' +
              '<button type="submit">Edit Comment</button>' +
            '</form>';
        }

        let actionRow =
          '<div class="comment-actiosn">' +'<button type="submit" form="' + replyFormId + '">Post</button>' + deleteBtn + editBtn + '</div>';


        let newComment = $(
          '<section class="single-comment" id="comment-' + esc(c._id) + '">' +
            '<span><strong><a href="/profile/' + esc(c.username) + '">' + esc(c.username) + '</a></strong></span>' + '<span> | </span>' + '<span>' + esc(c.date) + '</span>' + '<p>' + esc(c.message) + '</p>' +replyForm + actionRow +'<hr>' +'</section>'
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
