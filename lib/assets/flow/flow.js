'use strict';

$(document).ready(function () {
    var ARROW_UP_KEYCODE = 38,
        ARROW_DOWN_KEYCODE = 40,
        CURRENT_NAV_ITEM_SELECTOR = 'nav li.current',
        TIMESTAMP_PROPERTY = 'istanbul:timestamp',
        PATH_PROPERTY = 'istanbul:path';

    /**
     * Go to the next/previous nav item, optionally
     * skipping checked items.
     *
     * @param {String} direction - 'next' or 'prev'
     * @param {undefined | Boolean} skipChecked - true to skip checked items
     */
    function gotoNavItem(direction, skipChecked) {
        // Simulate a click on the next nav item
        var item = $(CURRENT_NAV_ITEM_SELECTOR);

        while (true) {
            item = item[direction]();

            if (item.length === 0) {
                return;
            }

            if (skipChecked) {
                if (item.children('input:not(:checked)').length) {
                    break;
                }
            } else {
                break;
            }
        }

        scrollNavItemIntoView(item);
        scrollItemIntoView(getNavItemTarget(item));
        selectNavItem(item);
    }

    function gotoNextNavItem(skipChecked) {
        gotoNavItem('next', skipChecked);
    }

    function gotoPreviousNavItem(skipChecked) {
        gotoNavItem('prev', skipChecked);
    }

    // Watch for arrow up/down events
    function handleKeydown(event) {
        if (event.keyCode === ARROW_UP_KEYCODE || event.keyCode === ARROW_DOWN_KEYCODE) {
            // If a nav item is highlighted, go to the previous/next one
            var item = $(CURRENT_NAV_ITEM_SELECTOR);

            if (item.length) {
                if (event.keyCode === ARROW_DOWN_KEYCODE) {
                    gotoNextNavItem();
                } else {
                    gotoPreviousNavItem();
                }

                event.preventDefault();
            }
        }
    }

    function getNavItemTarget(item) {
        return $('#' + item.data('target'));
    }

    function selectNavItem(item) {
        var target = getNavItemTarget(item);

        // If a nav item is currently highlighted, unhighlight it
        var previousItem = $(CURRENT_NAV_ITEM_SELECTOR);

        previousItem.toggleClass('current');

        // Highlight the clicked item
        item.toggleClass('current');

        // Focus its checkbox
        var checkbox = item.children('input[type=checkbox]');

        checkbox.get(0).focus();

        // Target item highlighting
        highlightItem(target);
        selectLine(item);
    }

    function highlightItem(item) {
        var borderWidth = 3,
            position = item.position(),
            width = item.outerWidth(),
            height = item.outerHeight();

        $('#item-outline').css({
            top: position.top - borderWidth + 'px',
            left: position.left - borderWidth + 'px',
            width: width + (borderWidth * 2) + 'px',
            height: height + (borderWidth * 2) + 'px'
        })
    }

    function handleNavItemClick() {
        var item = $(this).parent();

        selectNavItem(item);
        scrollItemIntoView(getNavItemTarget(item));
    }

    function selectLine(navItem) {
        var id = navItem.attr('data-target'),
            line = id.split('-')[1],
            span = $('table.coverage td.line-number > span[data-line=' + line + ']');

        $('table.coverage td.line-number > span.current').removeClass('current');
        span.addClass('current');
    }

    function scrollIntoView(item, tag, complete) {
        // Pass item to the completion function
        if (complete) {
            complete = complete.bind(null, item);
        }

        var container = $(tag),

            // The position of the item relative to the container's viewport
            itemRect = item.get(0).getBoundingClientRect(),

            // The bottom of the header, which is the visible top of the container (not including padding)
            visibleTop = $('header').outerHeight(),

            // The bottom of the viewport
            visibleBottom = $('body').height(),

            slop = 7,

            // Determine if the item is completely within the viewport
            completelyVisible = itemRect.top >= (visibleTop + slop) &&
                                itemRect.bottom <= (visibleBottom - slop);

        if (completelyVisible) {
            return;
        }

        var newScrollTop;

        if (tag === 'body') {
            // Start with the scroll position of the item relative to the container
            newScrollTop = item.offset().top;

            // Now move it to the top of the code area
            newScrollTop -= visibleTop;

            // Now move it down by 1/4 the height of the code area
            newScrollTop -= Math.floor((visibleBottom - visibleTop) / 4);
        } else {
            // How much margin we'd like to leave from the top/bottom of the container
            // when repositioning the item
            var margin = 10;

            // Start with the scroll position of the container
            newScrollTop = container.scrollTop();

            // Now move it to the top of the item
            newScrollTop += itemRect.top;

            if (itemRect.top <= visibleTop) {
                // Move it to the top of the container
                newScrollTop -= visibleTop;

                // Now move it down by the margin
                newScrollTop -= margin;
            } else {
                // Move it to the bottom of the container
                newScrollTop -= visibleBottom;

                // Now move it up so that the bottom of the item is at the bottom
                // of the container
                newScrollTop += itemRect.height;

                // Now move it up by the margin
                newScrollTop += margin;
            }
        }

        // Do the scroll
        var duration = tag === 'body' ? 500 : 300;

        container.scrollTo(
            newScrollTop,
            {
                lockSpeedBelow: 200,
                duration: duration,
                complete: complete
            });
    }

    function scrollItemIntoView(item) {
        scrollIntoView(item, 'body');
    }

    function scrollNavItemIntoView(item, complete) {
        scrollIntoView(item, 'nav', complete);
    }

    function updateMetricTitle(metric, uncovered) {
        var title = metric.parent().attr('title'),
            match = /^\d+ of (\d+)/.exec(title);

        if (match) {
            var total = Number(match[1]),
                covered = total - uncovered,
                pct = (covered / total) * 100;

            title = covered + ' of ' + total + ' covered (' + Math.round(pct) + '%)';
            metric.parent().attr('title', title);
        }
    }

    function handleNavItemToggle() {
        var item = $(this).parent(),
            targetId = item.data('target'),
            target = $('#' + targetId);

        target.toggleClass('uncovered', !this.checked);

        // Update the relevant uncovered metric
        var metricType = targetId.split('-')[0];

        if (metricType === 'path') {
            metricType = 'branch';
        }

        var metric = $('#' + metricType + '-metric'),
            uncovered = Number(metric.attr('data-uncovered'));

        uncovered += this.checked ? -1 : 1;
        metric.attr('data-uncovered', String(uncovered));

        // Update the display class
        if (uncovered) {
            metric.removeClass('covered').addClass('uncovered');
        } else {
            metric.removeClass('uncovered').addClass('covered');
        }

        // Update the title
        updateMetricTitle(metric, uncovered);

        // If the item is current, go to the next item
        if (this.checked && item.hasClass('current')) {
            gotoNextNavItem(true);
        }
    }

    function getNavItemByTargetId(id) {
        return $('nav li[data-target=' + id + ']');
    }

    function handleItemClick() {
        var item = getNavItemByTargetId(this.id);

        scrollNavItemIntoView(item);
        selectNavItem(item);
    }

    // Given a parent nav item, simulate a click on its text
    function clickNavItem(item) {
        item.children('span').click();
    }

    function currentPagePath() {
        return $('meta[property="' + PATH_PROPERTY + '"]').attr('content');
    }

    /*
        Data storage schema

        sessionStorage: {
            istanbul: {
                timestamp: String
                pages: [
                    <path>: {
                        summary: {
                            branch-metric: String,
                            function-metric: String,
                            statement-metric: String
                        },
                        items: {
                            <target id>: Boolean,  // nav item checkbox state
                            ...
                        }
                    }
                ]
            }
        }
     */

    function loadData() {
        var data = JSON.parse(sessionStorage.istanbul || '{}'),
            timestamp = $('meta[property="' + TIMESTAMP_PROPERTY + '"]').attr('content');

        // If the timestamp doesn't match, rebuild the data
        if (timestamp !== data.timestamp) {
            data = { timestamp: timestamp };
            saveData(data);
        } else {
            // We have current data, load it
            var path = currentPagePath(),
                pageData = data.pages[path];

            if (pageData) {
                loadSummaryData(pageData);

                if (isDetailPage(path)) {
                    loadDetailData(pageData);
                }
            }
        }
    }

    function loadSummaryData(data) {
        var summary = data.summary;

        Object.keys(summary).forEach(function (id) {
            var metric = $('span#' + id),
                uncovered = summary[id] !== '0';

            metric.attr('data-uncovered', summary[id]);
            metric.toggleClass('uncovered', uncovered);
            metric.toggleClass('covered', !uncovered);
        });
    }

    function loadDetailData(data) {
        var items = data.items,
            navItems = $('nav li');

        Object.keys(items).forEach(function (id) {
            var navItem = navItems.filter('li[data-target="' + id + '"]'),
                checkbox = navItem.children('input[type=checkbox]')[0],
                covered = items[id];

            checkbox.checked = covered;

            if (covered) {
                $('#' + id).removeClass('uncovered');
            }
        });
    }

    function saveData(data) {
        // We save one set of data for each page
        var pages = data.pages || {},
            path = currentPagePath(),
            pageData = pages[path] || {};

        saveSummaryData(pageData);

        if (isDetailPage(path)) {
            saveDetailData(pageData);
        }

        pages[path] = pageData;
        data.pages = pages;
        sessionStorage.istanbul = JSON.stringify(data);
    }

    function saveSummaryData(data) {
        data.summary = {};

        // Get the summary numbers from the header and save them
        $('header span.metric').each(function () {
            data.summary[this.id] = $(this).attr('data-uncovered');
        });
    }

    function saveDetailData(data) {
        data.items = {};

        // For each nav item, save an item whose key is the target id
        // and whose value is whether it has been checked.
        $('nav li').each(function () {
            var element = $(this),
                target = element.attr('data-target'),
                checkbox = element.children('input[type=checkbox]')[0];

            data.items[target] = checkbox.checked;
        })
    }

    function handleUnload() {
        saveData(JSON.parse(sessionStorage.istanbul || '{}'));
    }

    function isDetailPage(path) {
        path = path || currentPagePath();

        return path.slice(-3) === '.js';
    }

    function load() {
        window.addEventListener('unload', handleUnload);

        if (typeof prettyPrint === 'function') {
            prettyPrint();
        }

        // Check to see if there are any uncovered items
        if ($('header span.metric.uncovered').length) {
            loadData();

            // Setup event handlers for detail pages
            if (isDetailPage()) {
                $(document).keydown(handleKeydown);
                $('td.text').on('click', 'mark', handleItemClick);
                $('nav').on('change', 'input[type=checkbox]', handleNavItemToggle);
                $('nav li > span').on('click', handleNavItemClick);

                // When the page loads select the first nav link after a short delay
                setTimeout(function () {
                    clickNavItem($('nav li:first-child'));
                }, 250);
            }
        } else {
            // Otherwise add a class that will change the nav bar display
            $('nav').addClass('empty');
        }
    }

    load();
});
