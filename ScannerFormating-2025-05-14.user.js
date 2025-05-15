// ==UserScript==
// @name         ScannerFormating
// @namespace    http://reykjavik.is/
// @version      2025-05-14
// @description  format scanned barcodes
// @author       Einar Arnar Magnússon - UTR
// @match        https://www.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=undefined.localhost
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // CURRENTLY TESTING ON GOOGLE.COM
    // THE SCRIPT FORMATS SCANNED CODE AND SUBMITS THE RESULT AS A SEARCH

    //console.log("🔁 Script started");
    // Constants
    const input = document.getElementById("APjFqb");
    const rules = [
        {
            // 6-stafa kóði eftir
            name: "12-digits - 5 leading + trailing zero",
            match: val => val.length === 12 && val.startsWith("00000") && val.endsWith("0"),
            action: val => val.slice(5, -1) // Slice off first 5 and last 1
        },
        {
            // Fjarlægja 4 núll, 7-stafa kóði eftir
            name: "11-digits - 4 leading zeroes",
            match: val => val.length === 11 && val.startsWith("0000"),
            action: val => val.slice(4)
        }
    ];
    // Variables
    let ruleTriggered = null
    let scanBuffer = "";
    let scanStartTime = null;
    let scanTimeout = null;
    let isLikelyScan = false;

    if (input) {
        console.log("✅ Found input field:");
    } else {
        console.log("❌ Input field not found.");
        return;
    }

    // Only format if scan is detected - manual input is ignored
    input.addEventListener("keydown", (e) => {
        const char = e.key;

        if (char.length === 1) {
            if (!scanStartTime) {
                scanStartTime = performance.now();
                scanBuffer = "";
            }

            scanBuffer += char;

            clearTimeout(scanTimeout);
            scanTimeout = setTimeout(() => {
                const duration = performance.now() - scanStartTime;
                const avgCharTime = duration / scanBuffer.length;

                isLikelyScan = (
                    scanBuffer.length >= 6 &&
                    avgCharTime < 30
                );

                // Reset buffer tracking
                scanStartTime = null;
                scanBuffer = "";

                if (isLikelyScan) {
                    console.log("Scan detected!");

                    // Get value after full scan
                    let val = input.value;
                    let ruleTriggered = null;

                    for (const rule of rules) {
                        const matches =
                              typeof rule.match === "function"
                        ? rule.match(val)
                        : rule.match instanceof RegExp
                        ? rule.match.test(val)
                        : val === rule.match;

                        if (matches) {
                            val = rule.action(val);
                            ruleTriggered = rule.name;
                            break;
                        }
                    }

                    input.value = val;

                    if (ruleTriggered) {
                        console.log(`🛠️ Rule triggered: ${ruleTriggered}`);
                    }
                    input.focus();

                    // Simulate Enter after formatting
                    //const event = new KeyboardEvent("keydown", {key: "Enter", bubbles: true});
                    //input.dispatchEvent(event);
                    document.querySelector("form").submit();
                } else {
                    //console.log("Manual input - Enter skipped");
                    return;
                }

            }, 50);
        }
    });
})();