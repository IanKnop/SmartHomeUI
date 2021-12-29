/*  =========================================================
    KNOP.FAMILY
    Smart Home UI - News Feed Module Scripts
   
    (C) 2020-21 by Ian Knop, Weiterstadt, Germany
    www.knop.family
    ========================================================= */

var newsRefreshFrequency = 60;   /* How often the content is reloaded: FREQUENCY (i.e. 100) x UPDATE-FREQUENCY (i.e. 2 seconds) = 200 seconds */
var newsIteration = 0;

function newsfeedRefreshState(control, requestAnswer = null) {

    /* newsfeedRefreshState()___________________________________________________
    Refreshes news in feed                                                     */

    newsIteration = moduleSimpleRefreshState('News', control, newsIteration, newsRefreshFrequency);
}

function openNews(newsUrl) {
        
    /* openNews()______________________________________________________________
    Opens selected news for detail view                                       */

    return null;        

    var newsContainer = document.getElementById('news_container');
    var newsBox = document.getElementById('news_box');
    var newsContent = document.getElementById('news_content');

    newsContainer.style.display = 'none';
    newsBox.style.display = 'block';
    newsContent.src = newsUrl;
}

function closeNews() {

    /* closeNews()______________________________________________________________
    Close news detail view window                                              */

    var newsContainer = document.getElementById('news_container');
    var newsBox = document.getElementById('news_box');
    var newsContent = document.getElementById('news_content');

    newsContainer.style.display = 'block';
    newsBox.style.display = 'none';
}

