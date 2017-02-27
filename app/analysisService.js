spacialistApp.service('analysisService', ['httpGetFactory', function(httpGetFactory) {
    var analysis = {};

    analysis.entries = [];
    analysis.activeAnalysis = {
        isActive: false
    };

    analysis.getStoredQueries = function() {
        httpGetFactory('api/analysis/queries/getAll', function(queries) {
            analysis.storedQueries = queries;
        });
    };

    analysis.setAnalysisEntry = function(index) {
        var entry = analysis.entries[index];
        for(var k in entry) {
            if(entry.hasOwnProperty(k)) {
                analysis.activeAnalysis[k] = entry[k];
            }
        }
        analysis.activeAnalysis.isActive = true;
    };

    analysis.unsetAnalysisEntry = function() {
        for(var k in analysis.activeAnalysis) {
            if(analysis.activeAnalysis.hasOwnProperty(k)) {
                delete analysis.activeAnalysis[k];
            }
        }
    };

    function setEntries() {
        analysis.entries.push({
            name: 'New Data Analysis',
            url: 'db/?mode=query&navbar=off&padding=none'
        });
        analysis.entries.push({
            name: 'Browse Data Analysis',
            url: 'db/?mode=list&table=stored_queries&navbar=off'
        });
    }

    setEntries();

    return analysis;
}]);
