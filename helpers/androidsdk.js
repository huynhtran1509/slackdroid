var reference = require('../data/reference');

/**
 * Functions here originate in
 *   https://github.com/romannurik/AndroidSDKSearchExtension
 *   built by Roman Nurik
 */
function AndroidSdk() {

}

AndroidSdk.prototype.query = function(query) {
    
    if (!query) {
        return;
    }
    query = query.toString();
    query = query.replace(/(^ +)|( +$)/g, '');

    var queryPartsLower = query.toLowerCase().match(/[^\s]+/g) || [];

    // Filter all classes/packages.
    var results = [];

    for (var i = 0; i < reference.length; i++) {
        var result = reference[i];
        var textLower = (result.label + ' ' + result.subLabel).toLowerCase();
        
        for (var j = 0; j < queryPartsLower.length; j++) {
        
            if (!queryPartsLower[j]) {
                continue;
            }

            if (textLower.indexOf(queryPartsLower[j]) >= 0) {
                results.push(result);
                break;
            }
        }
    }
    rankResults(results, query);

    if (results != null && results.length > 0) {
        return results[0];
    } else {
        return null;
    }
}

function rankResults(matches, query) {
    query = query.toString() || '';
    matches = matches || [];

    // We replace dashes with underscores so dashes aren't treated
    // as word boundaries.
    var queryParts = query.toLowerCase().replace(/-/g, '_').match(/\w+/g) || [''];

    for (var i = 0; i < matches.length; i++) {
        var totalScore = (matches[i].extraRank || 0) * 200;

        for (var j = 0; j < queryParts.length; j++) {
            var partialAlnumRE = new RegExp(queryParts[j]);
            var exactAlnumRE = new RegExp('\\b' + queryParts[j] + '\\b');
            totalScore += resultMatchScore(exactAlnumRE, partialAlnumRE, j, matches[i]);
        }
        matches[i].__resultScore = totalScore;
    }

    matches.sort(function(a, b) {
        var n = b.__resultScore - a.__resultScore;
        if (n == 0) // lexicographical sort if scores are the same
            n = (a.label < b.label) ? -1 : 1;
        return n;
    });
}

function resultMatchScore(exactMatchRe, partialMatchRe, order, result) {
    // scores are calculated based on exact and prefix matches,
    // and then number of path separators (dots) from the last
    // match (i.e. favoring classes and deep package names)
    var score = 1.0;
    var labelLower = result.label.toLowerCase().replace(/-/g, '_');
    if (result.type == 'docs') {
        labelLower += ' ' + result.subLabel;
    }

    var t = regexFindLast(labelLower, exactMatchRe);
    if (t >= 0) {
        // exact part match
        var partsAfter = countChars(labelLower.substr(t + 1), '.');
        score *= 60 / (partsAfter + 1);
    } else {
        t = regexFindLast(labelLower, partialMatchRe);
        if (t >= 0) {
            // partial match
            var partsAfter = countChars(labelLower.substr(t + 1), '.');
            score *= 20 / (partsAfter + 1);
        }
    }

    if (!result.type.match(/ref/)) {
        // downgrade non-reference docs
        score /= 1.5;
    }
    score /= (1 + order / 2);
    return score;
}

/**
 * Helper function that counts the occurrences of a given character in
 * a given string.
 */
function countChars(s, c) {
    var n = 0;
    for (var i=0; i<s.length; i++)
        if (s.charAt(i) == c) ++n;
    return n;
}

/**
 * Helper function that gets the index of the last occurence of the given
 * regex in the given string, or -1 if not found.
 */
function regexFindLast(s, re) {

    if (s == '')
        return -1;
    var l = -1;
    var tmp;

    while ((tmp = s.search(re)) >= 0) {
        if (l < 0) l = 0;
            l += tmp;
        s = s.substr(tmp + 1);
    }
    return l;
}

module.exports = new AndroidSdk();