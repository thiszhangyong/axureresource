// use this to isolate the scope
(function () {

    if(!$axure.document.configuration.showConsole) { return; }

    $(document).ready(function () {
        $axure.player.createPluginHost({
            id: 'debugHost',
            context: 'inspect',
            title: '调试',
            gid: 3
        });

        generateDebug();

        $('#variablesClearLink').click(clearvars_click);
        $('#traceClear').click(cleartrace_click);
        $('#traceToggle').click(stoptrace_click);
        $('#traceStart').click(starttrace_click);
        $('#traceClear').hide();
        $('#traceToggle').hide();

        $('#closeConsole').click(close);

        var currentStack= [];
        var finishedStack = [];

        $axure.messageCenter.addMessageListener(function (message, data) {
            if(message == 'axCompositeEventMessage') {
                for(var i = 0; i < data.length; i++) {
                    processMessages(data[i].message, data[i].data);
                }
            } else processMessages(message, data);
        });

        var processMessages = function(message, data) {
            if(message == 'globalVariableValues') {
                $('#variablesDiv').empty();
                for(var key in data) {
                    var value = data[key] == '' ? '(blank)' : data[key];
                    $('#variablesDiv').append('<div class="variableList"><div class="variableName">' + key + '</div><div class="variableValue">' + value + '</div></div>');
                }
            } else if(message == 'axEvent') {
                var addToStack = "<div class='axEventBlock'>";
                addToStack += "<div class='axEventContainer'>";
                addToStack += "    <div class='axTime'>" + new Date().toLocaleTimeString() + "</div>";
                addToStack += "    <div class='axEvent'>" + data.event.description + ": </div>";
                addToStack += "    <div class='axLabel'>" + data.label + " (" + data.type + ")</div>";
                addToStack += "</div>";

                currentStack.push(addToStack);
            } else if (message == 'axEventComplete') {
                currentStack[currentStack.length - 1] += "</div>";
                finishedStack.push(currentStack.pop());
                if(currentStack.length == 0) {
                    $('#traceEmptyState').hide();
                    $('#traceClear').show();
                    $('#traceToggle').show();

                    for(var i = finishedStack.length - 1; i >= 0; i--) {
                        if($('#traceDiv').children().length > 99) $('#traceDiv').children().last().remove();
                        $('#traceDiv').prepend(finishedStack[i]);
                    }
                    finishedStack = [];
                }
            } else if (message == 'axCase') {
                //var addToStack = "<div class='axCaseContainer' style='background-color: #" + data.color + "'>";
                var addToStack = "<div class='axCaseContainer'>";
                addToStack += "    <div class='axCaseItem'>" + data.item + "</div>";
                if (data.description) { addToStack += "    <div class='axCaseDescription' title='" + data.description + "'>" + data.description + "</div>" };
                addToStack += "</div>";

                currentStack[currentStack.length - 1] += addToStack;
            } else if (message == 'axAction') {
                var addToStack = "<div class='axActionContainer'>";
                addToStack += "    <div class='axActionItem'>" + data.name + "</div>";
                //addToStack += "    <div class='axActionItem'>" + data.item + "</div>";
                //if (data.description) { addToStack += "    <div class='axActionDescription' title='" + data.description + "'>" + data.description + "</div>" };
                addToStack += "</div>";

                currentStack[currentStack.length - 1] += addToStack;
            } else if (message == 'axInfo') {
                var addToStack = "<div class='axInfoContainer'>";
                addToStack += "    <div class='axInfoItem'>" + data.item + "</div>";
                if (data.description) { addToStack += "    <div class='axInfoDescription' title='" + data.longDescription + "'>" + data.description + "</div>" };
                addToStack += "</div>";

                currentStack[currentStack.length - 1] += addToStack;
            }
        }

        // bind to the page load
        $axure.page.bind('load.debug', function () {
            var traceStr = $axure.player.getHashStringVar(TRACE_VAR_NAME);
            if (traceStr.length > 0) $axure.messageCenter.setState("isTracing", true);
            else $axure.messageCenter.setState("isTracing", false);
            $axure.messageCenter.postMessage('getGlobalVariables', '');

            return false;
        });

        function clearvars_click(event) {
            $axure.messageCenter.postMessage('resetGlobalVariables', '');
        }

        function close() {
            $axure.player.pluginClose("debugHost");
        }

        function cleartrace_click(event) {
            $('#traceDiv').html('');
        }

        function starttrace_click(event) {
            $axure.messageCenter.setState("isTracing", true);
            //$('#traceDiv').html('');
            $('#traceEmptyState').hide();
            $('#traceClear').show();
            $('#traceToggle').text('停止捕获');
            $('#traceToggle').off("click");
            $('#traceToggle').click(stoptrace_click);
            $('#traceToggle').show();
            console.log("开始捕获");
            $axure.player.setVarInCurrentUrlHash(TRACE_VAR_NAME, 1);
        }

        function stoptrace_click(event) {
            $axure.messageCenter.setState("isTracing", false);
            $('#traceDiv').prepend('<div class="tracePausedNotification">已暂停捕获事件<div>');
            $('#traceToggle').text('继续捕获');
            $('#traceToggle').off("click");
            $('#traceToggle').click(starttrace_click);
            console.log("暂停捕获");
            $axure.player.deleteVarFromCurrentUrlHash(TRACE_VAR_NAME);
        }
    });

    function generateDebug() {
        var pageNotesUi = "<div id='debugHeader'>";
        pageNotesUi += "<div id='debugToolbar'>";
        pageNotesUi += "<div id='consoleTitle' class='pluginNameHeader'>调试</div>";

        pageNotesUi += "</div>";
        pageNotesUi += "</div>";

        pageNotesUi += "<div id='variablesContainer' style='max-height:300px; overflow-y:auto'>";
        pageNotesUi += "<div id='variablesTitle' class='sectionTitle'>变量</div>";
        pageNotesUi += "<a id='variablesClearLink' class='traceOption'>重置变量</a>";
        pageNotesUi += "<div id='variablesDiv'></div></div>";
        pageNotesUi += "<div id='traceContainer'>";

        pageNotesUi += "<div id='traceHeader'>";
        pageNotesUi += "<span class='sectionTitle'>捕获事件</span><a id='traceClear' class='traceOption'>清空记录</a><a id='traceToggle' class='traceOption'>暂停捕获</a>";
        pageNotesUi += "</div>";
        pageNotesUi += "</div>";
        pageNotesUi += "<div id='debugScrollContainer'>";
        pageNotesUi += "<div id='debugContainer'>";


        pageNotesUi += "<div id='traceEmptyState'>";
        pageNotesUi += "<div class='startInstructions'>单击下面的按钮，页面触发的交互事件会在此处显示。</div>";
        pageNotesUi += "<div id='traceStart' class='startButton'>开始捕获</div>";
        pageNotesUi += "</div>";
        pageNotesUi += "<div id='traceDiv'></div></div>";
        pageNotesUi += "</div></div>";

        $('#debugHost').html(pageNotesUi);
        $('#traceEmptyState').show();
    }

})();   