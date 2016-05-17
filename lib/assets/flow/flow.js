'use strict';

$(document).ready(function () {
    var ARROW_UP_KEYCODE = 38,
        ARROW_DOWN_KEYCODE = 40,
        CURRENT_NAV_ITEM_SELECTOR = 'nav li.current',
        TIMESTAMP_PROPERTY = 'istanbul:timestamp',
        PATH_PROPERTY = 'istanbul:path';

    var sessionData,
        initialSummary;

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
            match = /^\d+ of (\d+).+?(, \d+ ignored|$)/.exec(title);

        if (match) {
            var total = Number(match[1]),
                ignored = match[2],
                covered = total - uncovered,
                pct = (covered / total) * 100;

            title = covered + ' of ' + total + ' covered (' + Math.round(pct) + '%)' + ignored;
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

        var id = metricType + '-metric',
            metric = $('#' + id),
            uncovered = Number(metric.attr('data-uncovered')),
            diff = this.checked ? -1 : 1;

        uncovered += diff;
        updateMetricValue(metric, uncovered);

        var pageData = sessionData.pages[currentPagePath()];

        pageData.summary[id] += diff;

        // If the item is current, go to the next item
        if (this.checked && item.hasClass('current')) {
            gotoNextNavItem(true);
        }

        updateDetailModifiedState();
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
        updateMetricTitle(metric, uncovered);
    }

    function updateDetailModifiedState() {
        var modified = $('nav li > input[type=checkbox]:checked').length !== 0;

        $('body').toggleClass('modified', modified);
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

            if (isDetailPage(path)) {
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

    function loadMetrics(data) {
        var summary = data.summary;

        Object.keys(summary).forEach(function (id) {
            var metric = $('span#' + id),
                uncovered = summary[id];

            updateMetricValue(metric, uncovered);
        });
    }

    // Maps summary table class names to header metric id names
    var summaryMap = {
        'statement-metric': 'statements',
        'branch-metric': 'branches',
        'function-metric': 'functions'
    };

    function loadSummaryData(pages, path) {
        // Go through all of the items in the summary and update the summary numbers
        var rows = $('section.summary tbody > tr'),
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
                    originalValue = cell.attr('data-uncovered');

                cell.attr('data-uncovered', String(uncovered));

                if (uncovered) {
                    cell.removeClass('covered').addClass('uncovered');
                } else {
                    cell.removeClass('uncovered').addClass('covered');
                }

                if (originalValue != uncovered) {
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

    function saveData(data, loading) {
        // We save one set of data for each page
        data = data || getSessionData();

        var pages = data.pages || {},
            path = currentPagePath(),
            detailPage = isDetailPage(path),
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

    function saveDetailData(data) {
        data.items = {};

        // For each nav item, save an item whose key is the target id
        // and whose value is whether it has been checked.
        $('nav li').each(function () {
            var element = $(this),
                target = element.attr('data-target'),
                checkbox = element.children('input[type=checkbox]').get(0);

            data.items[target] = checkbox.checked;
        })
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

    function handleUnload() {
        saveData(JSON.parse(sessionStorage.getItem('istanbul.flow') || '{}'));
    }

    function isDetailPage(path) {
        return $('body').hasClass('detail-page');
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

                // When the page loads select the first unchecked nav link after a short delay
                setTimeout(function () {
                    var unchecked = $('nav li > input[type=checkbox]:not(:checked)');

                    // If there is an unchecked nav item, select it. Otherwise select the first one.
                    if (unchecked.length) {
                        clickNavItem($(unchecked.get(0)).parent());
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
