'use strict';

/* jshint jquery: true */

$(document).ready(function () {
    var ARROW_UP_KEYCODE = 38,
        ARROW_DOWN_KEYCODE = 40,
        CURRENT_NAV_ITEM_SELECTOR = 'nav li.current',
        TIMESTAMP_PROPERTY = 'istanbul:timestamp',
        PATH_PROPERTY = 'istanbul:path';

    var sessionData,
        initialSummary;

    function getNavItemTarget(item) {
        return $('#' + item.data('target'));
    }

    function highlightItem(item) {
        $('mark.current').removeClass('current');

        var borderWidth = 3,
            position = item.position(),
            width = item.outerWidth(),
            height = item.outerHeight(),
            contentDiv = $('div.content'),
            scrollTop = contentDiv.scrollTop(),
            scrollLeft = contentDiv.scrollLeft(),
            outline = $('#item-outline');

        outline.css({
            top: scrollTop + position.top - borderWidth + 'px',
            left: scrollLeft + position.left - borderWidth + 'px',
            width: width + (borderWidth * 2) + 'px',
            height: height + (borderWidth * 2) + 'px'
        })
            .show();

        item.addClass('current');
    }

    function highlightItemCallback(item, animation, jumpedToEnd, message) {
        // Don't highlight if a scroll was cancelled
        if (message && message.cancelled) {
            return;
        }

        highlightItem(item);
    }

    function getItemCoordinates(item) {
        var position = item.position();

        return {
            // The position of the item relative to the container
            top: position.top,
            bottom: position.top + item.outerHeight()
        };
    }

    function scrollIntoView(item, tag, complete) {
        // We need to manage the scroll count
        var callback;

        if (complete) {
            callback = complete.bind(null, item);
        } else {
            callback = function() { };
        }

        var container = $(tag),
            coordinates = getItemCoordinates(item),

            // The bottom of the scroll container
            visibleBottom = container.outerHeight(),

            slop = 7,

            // Determine if the item is completely within the viewport
            completelyVisible = coordinates.top >= slop &&
                coordinates.bottom <= (visibleBottom - slop);

        if (completelyVisible) {
            container.stopScroll();
            callback();
            return;
        }

        // Start with the scroll position of the container
        var newScrollTop = container.scrollTop();

        if (tag === 'nav') {

            // Calculate the padding between the top of the nav and the first item
            var margin = container.scrollTop() + $('nav li:first-child').position().top;

            if (coordinates.top < margin) {
                // It's scrolled off the top, move it down into view
                newScrollTop += coordinates.top - margin;
            } else {
                // It's scrolled off the bottom, move it up into view
                newScrollTop += coordinates.bottom - visibleBottom + margin;
            }
        } else {
            // Scroll to the top of the item
            newScrollTop += coordinates.top;

            // Now move it down by 1/4 the height of the code area
            newScrollTop -= Math.floor(visibleBottom / 4);
        }

        // Do the scroll
        var duration = tag === 'nav' ? 300 : 500;

        container.scrollTo(
            newScrollTop,
            {
                lockSpeedBelow: 200,
                duration: duration,
                ignoreUser: true,
                always: callback
            });
    }

    function scrollItemIntoView(item) {
        // Hide highlight while content scrolls
        $('#item-outline').hide();
        scrollIntoView(item, 'div.content', highlightItemCallback);
    }

    function scrollNavItemIntoView(item, dontSelect) {
        scrollIntoView(item, 'nav', dontSelect ? undefined : selectNavItem);
    }

    function selectLine(navItem) {
        var id = navItem.attr('data-target'),
            line = id.split('-')[1],
            span = $('table.coverage td.line-number > span[data-line=' + line + ']');

        $('table.coverage td.line-number > span.current').removeClass('current');
        span.addClass('current');
    }

    function selectNavItem(item) { // jshint ignore:line
        // If a nav item is currently highlighted, unhighlight it
        var previousItem = $(CURRENT_NAV_ITEM_SELECTOR);

        previousItem.toggleClass('current');

        // Highlight the clicked item
        item.toggleClass('current');

        selectLine(item);
        scrollNavItemIntoView(item, true);
        scrollItemIntoView(getNavItemTarget(item));
    }

    /**
     * Go to the next/previous nav item, optionally skipping checked items.
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

        selectNavItem(item);
    }

    function gotoNextNavItem(skipChecked) {
        gotoNavItem('next', skipChecked);
    }

    function gotoPreviousNavItem(skipChecked) {
        gotoNavItem('prev', skipChecked);
    }

    function toggleNavItem() {
        var checkbox = $(CURRENT_NAV_ITEM_SELECTOR).children('input[type=checkbox]');

        checkbox.click();
    }

    function handleResize() {
        highlightItem($('mark.current'));
    }

    // Watch for arrow up/down events
    function handleKeydown(event) {
        var handler;

        // NOTE: event.keyCode is deprecated, but the alternative (event.key)
        // is not yet fully supported. So at some point this may break.
        switch (event.keyCode) {
            case ARROW_DOWN_KEYCODE:
                handler = gotoNextNavItem;
                break;

            case ARROW_UP_KEYCODE:
                handler = gotoPreviousNavItem;
                break;

            case 32: // space
                handler = toggleNavItem;
                break;
        }

        if (handler) {
            var item = $(CURRENT_NAV_ITEM_SELECTOR);

            if (item.length) {
                handler();
                event.preventDefault();
            }
        }
    }

    function handleNavItemClick(event) {
        var item = $(event.currentTarget).parent();

        selectNavItem(item);
    }

    function updateMetricTitle(metric, uncovered) {
        var title = metric.attr('title'),
            match = /^\d+ of (\d+).+?(, \d+ ignored|$)/.exec(title);

        if (match) {
            var total = Number(match[1]),
                ignored = match[2],
                covered = total - uncovered,
                pct = (covered / total) * 100;

            title = covered + ' of ' + total + ' covered (' + Math.round(pct) + '%)' + ignored;
            metric.attr('title', title);
        }
    }

    function updateMetricValue(metric, uncovered) {
        metric.attr('data-uncovered', String(uncovered));

        // Update the display class
        if (uncovered) {
            metric.removeClass('covered').addClass('uncovered');
        } else {
            metric.removeClass('uncovered').addClass('covered');
        }

        // Update the title
        updateMetricTitle(metric.parent(), uncovered);
    }

    function updateDetailModifiedState() {
        var modified = $('nav li > input[type=checkbox]:checked').length !== 0;

        $('body').toggleClass('modified', modified);
    }

    function currentPagePath() {
        return $('meta[property="' + PATH_PROPERTY + '"]').attr('content');
    }

    function handleNavItemToggle(event) {
        var item = $(event.currentTarget).parent(),
            targetId = item.data('target'),
            target = $('#' + targetId);

        target.toggleClass('uncovered', !event.currentTarget.checked);

        // Update the relevant uncovered metric
        var metricType = targetId.split('-')[0];

        if (metricType === 'path') {
            metricType = 'branch';
        }

        var id = metricType + '-metric',
            metric = $('#' + id),
            uncovered = Number(metric.attr('data-uncovered')),
            diff = event.currentTarget.checked ? -1 : 1;

        uncovered += diff;
        updateMetricValue(metric, uncovered);

        var pageData = sessionData.pages[currentPagePath()];

        pageData.summary[id] += diff;

        // If the item is current, go to the next item
        if (event.currentTarget.checked && item.hasClass('current')) {
            gotoNextNavItem(true);
        }

        updateDetailModifiedState();
    }

    function getNavItemByTargetId(id) {
        return $('nav li[data-target=' + id + ']');
    }

    function handleNavItemFocus(event) {
        // Don't let checkboxes get focus
        event.currentTarget.blur();
    }

    function handleItemClick(event) {
        var item = getNavItemByTargetId(event.currentTarget.id);

        scrollNavItemIntoView(item);
    }

    // Given a parent nav item, simulate a click on its text
    function clickNavItem(item) {
        item.children('span').click();
    }

    /*
        Data storage schema

        sessionStorage: {
            istanbul.flow: {
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

    // Maps summary table class names to header metric id names
    var summaryMap = {
        'statement-metric': 'statements',
        'branch-metric': 'branches',
        'function-metric': 'functions'
    };

    function loadMetrics(data) {
        var summary = data.summary;

        Object.keys(summary).forEach(function (id) {
            var metric = $('span#' + id),
                uncovered = summary[id];

            updateMetricValue(metric, uncovered);
        });
    }

    function loadSummaryData(pages, path) {
        // Go through all of the items in the summary and update the summary numbers
        var rows = $('table.summary tbody > tr'),
            summaryModified = false;

        rows.each(function () {
            var cells = $(this).children(),
                fileCell = cells.filter('.file'),
                file = fileCell.children('a').get(0).textContent,
                pageData = pages[path + file];

            if (!pageData) {
                return;
            }

            var summary = pageData.summary;

            if (!summary) {
                return;
            }

            var modified = false;

            Object.keys(summary).forEach(function (key) {
                var cell = cells.filter('.' + summaryMap[key]),
                    uncovered = summary[key],
                    originalValue = Number(cell.attr('data-uncovered'));

                cell.attr('data-uncovered', String(uncovered));
                updateMetricTitle(cell, uncovered);

                if (uncovered) {
                    cell.removeClass('covered').addClass('uncovered');
                } else {
                    cell.removeClass('uncovered').addClass('covered');
                }

                if (originalValue !== uncovered) {
                    modified = true;
                }
            });

            fileCell.toggleClass('modified', modified);

            if (modified) {
                summaryModified = true;
            }
        });

        $('body').toggleClass('modified', summaryModified);
    }

    function loadDetailData(data) {
        var items = data.items,
            navItems = $('nav li');

        Object.keys(items).forEach(function (id) {
            var navItem = navItems.filter('li[data-target="' + id + '"]'),
                checkbox = navItem.children('input[type=checkbox]').get(0),
                covered = items[id];

            checkbox.checked = covered;

            if (covered) {
                $('#' + id).removeClass('uncovered');
            }
        });

        updateDetailModifiedState();
    }

    function getSessionData() {
        if (!sessionData) {
            sessionData = JSON.parse(sessionStorage.getItem('istanbul.flow') || '{}');
        }

        return sessionData;
    }

    function calculateSummaryChanges(summary, compareTo) {
        // Calculate the changes in the summary numbers
        var changes = {},
            changed = false;

        Object.keys(summary).forEach(function (key) {
            changes[key] = summary[key] - compareTo[key];

            if (changes[key]) {
                changed = true;
            }
        });

        if (changed) {
            return changes;
        }

        return null;
    }

    function saveSummaryData(data, detailPage, loading) {
        if (detailPage && loading && data.summary) {
            initialSummary = Object.assign({}, data.summary);
        }

        // We only do change detection when unloading
        data.summary = {};

        // Get the summary numbers from the header and save them
        $('header span.metric').each(function () {
            data.summary[this.id] = Number($(this).attr('data-uncovered'));
        });

        if (detailPage) {
            if (loading) {
                if (!initialSummary) {
                    initialSummary = Object.assign({}, data.summary);
                }
            } else {
                return calculateSummaryChanges(data.summary, initialSummary);
            }
        }

        return null;
    }

    function saveDetailData(data) {
        data.items = {};

        // For each nav item, save an item whose key is the target id
        // and whose value is whether it has been checked.
        $('nav li').each(function () {
            var element = $(this),
                target = element.attr('data-target'),
                checkbox = element.children('input[type=checkbox]').get(0);

            data.items[target] = checkbox.checked;
        });
    }

    function updateParentSummaries(pages, path, summaryChanges) {
        /*
            istanbul organizes coverage data into a root directory
            whose contents are all directories in the project.
            Each of those directories contains only the files in the directory.

            So when a detail page is updated, we only need to update
            the summaries of the parent directory and the root.
        */
        var parent = path.substr(0, path.lastIndexOf('/') + 1);

        [parent, '/'].forEach(function (dir) {
            var pageData = pages[dir] || {},
                summary = pageData.summary || {};

            Object.keys(summary).forEach(function (key) {
                summary[key] += summaryChanges[key];
            });

            pageData.summary = summary;
            pages[path] = pageData;
        });
    }

    function isDetailPage() {
        return $('body').hasClass('detail-page');
    }

    function saveData(data, loading) {
        // We save one set of data for each page
        data = data || getSessionData();

        var pages = data.pages || {},
            detailPage = isDetailPage(),
            path = currentPagePath(),
            pageData = pages[path] || {},
            summaryChanges = saveSummaryData(pageData, detailPage, loading);

        if (detailPage) {
            saveDetailData(pageData);

            if (summaryChanges) {
                updateParentSummaries(pages, path, summaryChanges);
            }
        }

        pages[path] = pageData;
        data.pages = pages;
        sessionStorage.setItem('istanbul.flow', JSON.stringify(data));
        sessionData = data;
    }

    function loadData() {
        var data = getSessionData(),
            timestamp = $('meta[property="' + TIMESTAMP_PROPERTY + '"]').attr('content');

        // If the timestamp doesn't match, rebuild the data
        if (timestamp !== data.timestamp) {
            data = { timestamp: timestamp };
            saveData(data, true);
        }

        var path = currentPagePath(),
            pageData = data.pages[path];

        if (pageData) {
            loadMetrics(pageData);

            if (isDetailPage()) {
                initialSummary = Object.assign({}, pageData.summary);
                loadDetailData(pageData);
            } else {
                loadSummaryData(data.pages, path);
            }
        } else {
            // If there is no data for the page, build it now
            saveData(data, true);
        }
    }

    function handleUnload() {
        saveData(JSON.parse(sessionStorage.getItem('istanbul.flow') || '{}'));
    }

    function load() {
        window.addEventListener('beforeunload', handleUnload);

        if (typeof prettyPrint === 'function') {
            prettyPrint(); // jshint ignore:line
        }

        // Check to see if there are any uncovered items
        if ($('header span.metric.uncovered').length) {
            loadData();

            // Setup event handlers for detail pages
            if (isDetailPage()) {
                $(window).resize(handleResize);
                $(document).keydown(handleKeydown);
                $('td.code').on('click', 'mark', handleItemClick);
                $('nav').on('change', 'input[type=checkbox]', handleNavItemToggle);
                $('nav').on('focus', 'input[type=checkbox]', handleNavItemFocus);
                $('nav li > span').on('click', handleNavItemClick);

                // When the page loads select the first unchecked nav link after a short delay
                setTimeout(function () {
                    var unchecked = $('nav li > input[type=checkbox]:not(:checked)');

                    // If there is an unchecked nav item, select it. Otherwise select the first one.
                    if (unchecked.length) {
                        var item = $(unchecked.get(0)).parent();

                        clickNavItem(item);
                    } else {
                        clickNavItem($('nav li:first-child'));
                    }
                }, 250);
            }
        } else {
            // Otherwise add a class that will change the nav bar display
            $('nav').addClass('empty');
        }
    }

    load();
});
