const feedCache = {};
let currentFeedUrl = '';
let currentPage = 1;
const POSTS_PER_PAGE = 5;
let latestRequestId = 0;

// Handlebars helper
Handlebars.registerHelper('formatDate', date => moment(date).format('LLL'));

function renderTemplate(templateId, context, targetId) {
    const source = $(templateId).html();
    const template = Handlebars.compile(source);
    $(targetId).html(template(context));
}

function paginate(posts, page) {
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    const start = (page - 1) * POSTS_PER_PAGE;
    const paginatedPosts = posts.slice(start, start + POSTS_PER_PAGE);

    renderTemplate("#post-template", { posts: paginatedPosts }, "#postsContainer");

    let paginationHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button class="page-btn" data-page="${i}">${i}</button>`;
    }
    $('#pagination').html(paginationHTML);
    $(`.page-btn[data-page="${page}"]`).addClass('active');
}

function fetchFeed(url) {
    const requestId = ++latestRequestId;
    $('#postsContainer, #errorContainer, #pagination').empty();
    renderTemplate('#loading-template', {}, '#loadingContainer');

    if (feedCache[url]) {
        $('#loadingContainer').empty();
        currentPage = 1;
        paginate(feedCache[url], currentPage);
        return;
    }

    $.ajax({
        url: `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
        dataType: 'json'
    })
        .done(data => {
            if (requestId !== latestRequestId) return;
            $('#loadingContainer').empty();
            const posts = data.items;
            feedCache[url] = posts;
            currentPage = 1;
            paginate(posts, currentPage);
        })
        .fail(err => {
            if (requestId !== latestRequestId) return;
            $('#loadingContainer').empty();
            renderTemplate('#error-template', { message: err.statusText }, '#errorContainer');
        });
}

$(document).ready(function () {
    $('#feedSelector').on('change', function () {
        currentFeedUrl = $(this).val();
        fetchFeed(currentFeedUrl);
    });

    $('#pagination').on('click', '.page-btn', function () {
        currentPage = parseInt($(this).data('page'), 10);
        paginate(feedCache[currentFeedUrl], currentPage);
    });

    currentFeedUrl = $('#feedSelector').val();
    fetchFeed(currentFeedUrl);
});
