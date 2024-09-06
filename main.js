///<reference path = "jquery-3.7.1.min.js"/>

// EACH PRESS ON THE HOME BUTTON WILL APPLY THE FUNC BACK TO HOME PAGE

$(document).ready(function () {
  $("#homeBtn").on("click", () => showHome());
});

$("#myModal").hide();

/// TRY CATCH FOR THE URLS

let coinListArr = [];
$(async () => {
  showLoading();
  try {
    let coinsData = await getCoinsFromApi();
    coinListArr = coinsData;
    showData(coinListArr);
  } catch (e) {
    console.log(`Error ${e}`);
    displayErr(e);
  } finally {
    hideLoading();
  }
});

/// GO BACK HOME PAGE FUNC

function showHome() {
  $("#errorMessages").hide();
  showData(coinListArr);
}

/// GET COINS FROM API FUNC

async function getCoinsFromApi() {
  return new Promise((resolve, reject) => {
    $.ajax({
      method: "GET",
      url: `https://api.coingecko.com/api/v3/coins/list`,
      success: (data) => {
        let coinsList = data.slice(0, 100);
        resolve(coinsList);
      },
      error: (e) =>
        reject(
          `Error loading the coins data from the url, The server is probably loaded, please try again later.`
        ),
    });
  });
}

/// SHOW DATA FUNC

async function showData(coins) {
  $("#chartContainer").hide();
  $("#homeBtn").addClass("activePage");
  $("#liveReportesBtn").removeClass("activePage");
  $("#aboutBtn").removeClass("activePage");
  $("#mainContectDiv").removeClass("mainContectDivLiveReportesClass");
  $("#mainContectDiv").removeClass("mainContectDivAboutClass");

  $("#mainContectDiv").addClass("mainContectDivHomeDefault");
  $("#mainContectDiv").html("");
  for (let coin of coins) {
    let coinCardId = `coin-${coin.id}`;
    $("#mainContectDiv").append(`
        <div class="card singleCoinDiv mb-3">
          <h4 class="underlined">${coin.symbol}</h4>
          <p class="underlined">${coin.name}</p>
          <button onclick="handleCoinInfo('${coin.id}', this)" type="button" class="btn btn-outline-info">Show More Info</button>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" data-coin-symbol="${coin.symbol}" id="flexSwitchCheckDefault">
          </div>
          <div class="coinInfoDiv"></div>
        </div>
      `);
  }
}

/// BRING EACH COIN INFO AND BRINGS NEW DATA AFTER 2 MINUTES ON NEW CLICK

let coinCache = {};

async function bringSingleCoinInfo(coinId) {
  let now = new Date().getTime();
  let cacheEntry = coinCache[coinId];

  if (cacheEntry && now - cacheEntry.timestamp < 2 * 60 * 1000) {
    return cacheEntry.data;
  }

  return new Promise((resolve, reject) => {
    $.ajax({
      method: "GET",
      url: `https://api.coingecko.com/api/v3/coins/${coinId}`,
      success: (singleCoinData) => {
        coinCache[coinId] = {
          data: singleCoinData,
          timestamp: now,
        };
        resolve(singleCoinData);
      },
      error: (e) => {
        console.log("Error loading single coin data:", e);
        reject(`Error loading the single coin data`, e);
      },
    });
  });
}

/// TRY CATCH FOR EACH COIN INFO (coinId from each coin display)

async function handleCoinInfo(coinId, button) {
  try {
    toggleCardInfo(coinId, button);
  } catch (e) {
    console.log(e);
    displayErr(e);
  }
}

/// SHOW EACH COIN INFO

async function toggleCardInfo(coinId, button) {
  $(".coinInfoDiv").slideUp();
  $(".btn-outline-info").text("Show More Info");

  let coinInfoDiv = $(button).closest(".singleCoinDiv").find(".coinInfoDiv");

  if (coinInfoDiv.is(":visible")) {
    coinInfoDiv.slideUp();
    $(button).text("Show More Info");
  } else {
    try {
      let singleCoinInfo = await bringSingleCoinInfo(coinId);

      let priceUsd = singleCoinInfo.market_data?.current_price?.usd || "N/A";
      let priceEur = singleCoinInfo.market_data?.current_price?.eur || "N/A";
      let priceIls = singleCoinInfo.market_data?.current_price?.ils || "N/A";
      let pic = singleCoinInfo.image.small;

      let formattedPriceUsd = priceUsd !== "N/A" ? `$${priceUsd}` : priceUsd;
      let formattedPriceEur = priceEur !== "N/A" ? `€${priceEur}` : priceEur;
      let formattedPriceIls = priceIls !== "N/A" ? `₪${priceIls}` : priceIls;

      coinInfoDiv.html(`
          <div class="coinInfo mt-3">
            <img src="${pic}" alt="${singleCoinInfo.name}" class="img-fluid mb-2">
            <p>Price in USD: ${formattedPriceUsd}</p>
            <p>Price in EUR: ${formattedPriceEur}</p>
            <p>Price in ILS: ${formattedPriceIls}</p>
          </div>
        `);

      coinInfoDiv.slideDown();
      $(button).text("Hide Info");
    } catch (e) {
      console.log(e);
      displayErr(e);
    }
  }
}

/// SHOW THE USER SEARCH INFO

$("#userSearchBtn").on("click", () => {
  $("#chartContainer").hide();
  $("#mainContectDiv").html("Your Search:<br>");

  let userSearch = $("#userSearchInput").val().toLowerCase();
  let foundCoin = false;
  for (let coin of coinListArr) {
    if (coin.id === userSearch) {
      foundCoin = true;
      $("#mainContectDiv").append(`
          <div class="card userSingleCoinDiv mb-3">
            <h5 class="underlined">${coin.id}</h5>
            <p class="underlined">${coin.symbol}</p>
            <p class="underlined">${coin.name}</p>
          </div>
        `);

      break;
    }
  }
  if (!foundCoin) {
    $("#mainContectDiv").append(`Could not find coin named: ${userSearch}`);
  }
});

/// SAVE THE SELECTED COINS ARR

let selectedCoinsArr = [];

$(document).ready(() => {
  $(document).on("change", ".form-check-input", function () {
    handleSwitchChange(this);
  });
});

function handleSwitchChange(input) {
  let coinSymbol = $(input).data("coin-symbol");
  if ($(input).is(":checked")) {
    if (!selectedCoinsArr.includes(coinSymbol)) {
      selectedCoinsArr.push(coinSymbol);
    }
  } else {
    selectedCoinsArr = selectedCoinsArr.filter((id) => id !== coinSymbol);
  }
  console.log(selectedCoinsArr);

  if (selectedCoinsArr.length > 5) {
    showModel(selectedCoinsArr);
  }
}

function showLoading() {
  $("#loadingSpinner").show();
}

function hideLoading() {
  $("#loadingSpinner").hide();
}

function displayErr(e) {
  $("#mainContectDiv").html(`${e}`);
}

let selectedCoinsFromModal = [];

function showModel(currentArrList) {
  $("#saveModelBtn").prop("disabled", true);
  $("#myModal").modal("show");
  $("#modelContent").html("");

  $(document).off("change", ".switchFromModel");

  selectedCoinsFromModal = [...currentArrList];

  for (let coin of currentArrList) {
    $("#modelContent").append(`
        <div class="modelCoinDiv underlined">
          <p>${coin}</p>
          <div class="form-check form-switch">
            <input class="form-check-input switchFromModel" type="checkbox" data-coin-symbol="${coin}" checked>
          </div>
        </div>
      `);
  }

  $(document).on("change", ".switchFromModel", function () {
    let coinSymbol = $(this).data("coin-symbol");

    if ($(this).is(":checked")) {
      if (!selectedCoinsFromModal.includes(coinSymbol)) {
        selectedCoinsFromModal.push(coinSymbol);
      }
    } else {
      selectedCoinsFromModal = selectedCoinsFromModal.filter(
        (id) => id !== coinSymbol
      );
    }

    console.log(selectedCoinsFromModal);

    if (selectedCoinsFromModal.length > 5) {
      $("#saveModelBtn").prop("disabled", true);
    } else {
      $("#saveModelBtn").prop("disabled", false);
    }
  });
}

/// REMOVE THE LAST COIN ADDED WHEN X BUTTON IS CLICKED

let lastSelectedCoin;

function saveLastSelectedCoin() {
  lastSelectedCoin = selectedCoinsArr[selectedCoinsArr.length - 1];
}

$(document).on("show.bs.modal", "#myModal", saveLastSelectedCoin);

$(document).on("hidden.bs.modal", "#myModal", function () {
  if (lastSelectedCoin) {
    selectedCoinsArr = selectedCoinsArr.filter((id) => id !== lastSelectedCoin);

    $(`.form-check-input[data-coin-symbol="${lastSelectedCoin}"]`).prop(
      "checked",
      false
    );

    lastSelectedCoin = null;
  }
});

$("#saveModelBtn").on("click", () => {
  selectedCoinsArr = selectedCoinsFromModal;

  $("#myModal").modal("hide");

  $(".form-check-input").prop("checked", false);

  for (let coinId of selectedCoinsArr) {
    $(`.form-check-input[data-coin-symbol="${coinId}"]`).prop("checked", true);
  }
});

$("#cancelBtn").on("click", () => {
  $("#myModal").modal("hide");
});

///LIVE REPORTES BTN
//https://www.cryptocompare.com/data/pricemulti?fsyms=ETH,BTC&tsyms=USD

let liveReportesArr = [];
const apiKey =
  "1ea16943bd59abc7fb4ae9264ca72750728221648c6d5889a3fc7aeb3f310631";
let urlLink;
let hasError = false;

$("#liveReportesBtn").on("click", async () => {
  $("#liveReportesBtn").addClass("activePage");
  $("#homeBtn").removeClass("activePage");
  $("#aboutBtn").removeClass("activePage");
  $("#mainContectDiv").removeClass("mainContectDivHomeDefault");
  $("#mainContectDiv").removeClass("mainContectDivAboutDefault");

  $("#mainContectDiv").addClass("mainContectDivLiveReportesClass");

  $("#mainContectDiv").html(
    '<h2 class="underlined liveReportesHeaderClass">Welcome To Live-Reports</h2>'
  );

  urlLink = selectedCoinsArr.join(",");
  let LiveReportesPromise = async () => {
    return new Promise((resolve, reject) => {
      $.ajax({
        method: "GET",
        url: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${urlLink}&tsyms=USD&api_key=${apiKey}`,
        success: (liveReportesDataPromise) => {
          liveReportesArr = liveReportesDataPromise;
          resolve(liveReportesDataPromise);
        },
        error: (e) => reject("Error loading live reportes data", e),
      });
    });
  };
  try {
    let liveReportesData = await LiveReportesPromise();
    displayLiveReportes(liveReportesData);
  } catch (e) {
    console.log(e);
    displayErr(e);
  }
});

let chart;
let chartDataPoints = {};
let updateInterval = 2000;

$(document).ready(function () {
  chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: "Live Crypto Data",
    },
    axisX: {
      title: "Time",
    },
    axisY: {
      title: "Price in USD",
      includeZero: false,
    },
    data: [],
  });

  chart.render();

  $("#chartContainer").show();
});

async function liveReportesPromise() {
  return new Promise((resolve, reject) => {
    $.ajax({
      method: "GET",
      url: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${urlLink}&tsyms=USD&api_key=${apiKey}`,
      success: (liveReportesDataPromise) => {
        console.log(liveReportesDataPromise);
        resolve(liveReportesDataPromise);
      },
      error: (e) => reject("Error loading live reportes data", e),
    });
  });
}

async function displayLiveReportes(liveReportesData) {
  $("#chartContainer").show();

  $("#errorMessages").remove();

  let errorMessagesDiv = $(
    '<div id="errorMessages" style="color: red; font-weight: bold; margin-bottom: 10px;"></div>'
  );
  $("#chartContainer").before(errorMessagesDiv);

  for (let symbol in liveReportesData) {
    if (!chartDataPoints[symbol]) {
      chartDataPoints[symbol] = [];
      chart.options.data.push({
        type: "line",
        name: symbol,
        showInLegend: true,
        dataPoints: chartDataPoints[symbol],
      });
    }
  }

  setInterval(async () => {
    try {
      let newLiveReportesData = await liveReportesPromise();
      let time = new Date();

      let intervalHasError = false;

      for (let symbol in chartDataPoints) {
        if (newLiveReportesData[symbol]) {
          let price = newLiveReportesData[symbol].USD;
          chartDataPoints[symbol].push({ x: time, y: price });

          if (chartDataPoints[symbol].length > 100) {
            chartDataPoints[symbol].shift();
          }
        } else {
          console.log(`${symbol} did not return data, keeping previous data.`);
          if (!hasError) {
            $("#errorMessages").append(
              `<p>Data not available for ${symbol}</p>`
            );
            hasError = true;
          }
          intervalHasError = true;
        }
      }

      if (!intervalHasError) {
        hasError = false;
      }

      chart.render();
    } catch (e) {
      console.log("Error updating live reportes data:", e);
    }
  }, updateInterval);
}

///ABOUT BTN

$("#aboutBtn").on("click", () => {
  $("#errorMessages").hide();
  $("#chartContainer").hide();
  $("#aboutBtn").addClass("activePage");
  $("#homeBtn").removeClass("activePage");
  $("#liveReportesBtn").removeClass("activePage");
  $("#mainContectDiv").removeClass("mainContectDivLiveReportesClass");
  $("#mainContectDiv").removeClass("mainContectDivHomeDefault");

  $("#mainContectDiv").addClass("mainContectDivAboutDefault");

  $("#mainContectDiv").html(`
        <div class="about-container">
            <div class="about-header">
                <h2>About This Project</h2>
            </div>
            <div class="about-content">
                <div class="about-image">
                    <img src="/images/file.jpg" alt="Your Photo">
                </div>
                <div class="about-text">
                    <p>Hello! My name is Yuval Samimian. I'm a Full-stuck Developer and this is my project. Here I showcase various cryptocurrency data using different APIs. This project is designed to provide real-time information on cryptocurrencies, including live price updates and detailed coin data.</p>
                    <p>If you have any questions or just want to get in touch, feel free to connect with me on social media:</p>
                    <div class="social-links">
                        <a href="https://www.facebook.com/your-profile" target="_blank" title="Facebook">
                            <i class="fab fa-facebook"></i> Facebook
                        </a>
                        <a href="https://www.linkedin.com/in/your-profile" target="_blank" title="LinkedIn">
                            <i class="fab fa-linkedin"></i> LinkedIn
                        </a>
                        <a href="mailto:your-email@example.com" title="Email">
                            <i class="fas fa-envelope"></i> Email
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `);
});
