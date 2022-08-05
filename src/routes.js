const Apify = require("apify");
const Router = require("./router.js");
const Cheerio = require("cheerio");

const {
    utils: { log },
} = Apify;

const BASE_URL = "https://ww1.cuevana3.me/";

class ItemModel {
    constructor() {
        this.ItemCode = "";
        this.ItemUrl = "";
        this.ItemTitle = "";
        this.ItemQty = "20";
        this.ItemStatus = ""; // On Sale | Sold Out
        this.BrandName = "";
        this.ItemPrice = "";
        this.ItemRetailPrice = "";
        this.ShippingInfo = "";
        this.StandardImage = "";
        this.OtherImages = [];
        this.ItemDescription = "";
        this.ItemOption = {};
        this.ItemOptionData = [];
        this.ItemWeight = "";
        this.ItemSize = "";
        this.ItemExpiredate = "";
        this.ISBNCode = "";
        this.UPCCode = "";
        this.ItemMFGdate = "";
        this.ItemModelNo = "";
        this.ItemMaterial = "";
        this.Memo = "";
        this.Category = "";
    }
}

exports.handleStart = async ({ request, $ }) => {};

exports.handleMainCategory = async ({ request, $ }) => {
    const requestQueue = await Apify.openRequestQueue();

    async function getItems($) {
        let items = $(
            "ul[class='MovieList Rows AX A06 B04 C03 E20'] li div a"
        ).toArray();
        return items.map((item) => $(item).attr("href"));
    }

    async function getPagination($) {
        let pagination = $(".nav-links a:nth-last-child(2)").text();
        const pageURLS = await generatePages(2, Number(pagination));
        return pageURLS;
    }

    async function generatePages(min, max) {
        let paginationUrls = [];
        for (let page = min; page <= max; page++) {
            let pagUrl = `${request.url}/page/${page}/`;
            paginationUrls.push(pagUrl);
        }
        return paginationUrls;
    }

    /**************************************************************************/

    let pages = request.userData.pages;
    let isPaginaton = request.url.includes("/page/");

    if (pages === undefined && isPaginaton) {
        let itemsUrls = await getItems($);

        for (const url of itemsUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }
    } else if (pages === "0" || pages === "auto") {
        let itemsUrls = await getItems($);
        let pagesUrls = await getPagination($);

        for (const url of pagesUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }

        for (const url of itemsUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }
    } else if (pages.includes("-")) {
        pages = pages.split("-");
        let minPage = Number(pages[0]);
        let maxPage = Number(pages[1]);
        let pagesUrls = await generatePages(minPage, maxPage);

        for (const url of pagesUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }

        if (minPage == 1) {
            let itemsUrls = await getItems($);
            for (const url of itemsUrls) {
                let req = Router.urlRouter(url);
                await requestQueue.addRequest(req);
            }
        }
    } else if (
        !pages.includes("-") &&
        !pages.includes("auto" && pages != "0")
    ) {
        pages = Number(pages);
        if (pages == 1) {
            let itemsUrls = await getItems($);
            for (const url of itemsUrls) {
                let req = Router.urlRouter(url);
                await requestQueue.addRequest(req);
            }
        } else {
            let pagesUrls = await generatePages(pages, pages);
            for (const url of pagesUrls) {
                let req = Router.urlRouter(url);
                await requestQueue.addRequest(req);
            }
        }
    }
};

exports.handleSubCategory = async ({ request, $ }) => {};

exports.handleDetail = async ({ request, $ }) => {
    // async function getItemOptionData($) {
    //     let itemImages = [];
    //     let itemOptionData = [];
    //     let itemOptions = {};
    //     let data = $("#nm-variations-form").attr("data-product_variations");

    //     if (!data) {
    //         return {
    //             itemImages,
    //             itemOptions,
    //             itemOptionData,
    //         };
    //     } else {
    //         let variations = JSON.parse(data);
    //         let visibleVariations = $("table.variations li").toArray();
    //         visibleVariations = visibleVariations.map((item) =>
    //             $(item).attr("data-value")
    //         );
    //         for (const variation of variations) {
    //             if (
    //                 visibleVariations.includes(
    //                     variation.attributes.attribute_pa_color
    //                 )
    //             ) {
    //                 let newItem = {};
    //                 newItem.Color =
    //                     variation.attributes.attribute_pa_color.replaceAll(
    //                         "-",
    //                         " "
    //                     );
    //                 newItem.price = variation.display_price;
    //                 newItem.availability = variation.is_in_stock;
    //                 itemOptionData.push(newItem);
    //                 itemImages.push(variation.image.full_src);
    //             } else {
    //                 continue;
    //             }
    //         }
    //         let options = itemOptionData.map((item) => item.Color).join(",");
    //         itemOptions.Color = options;
    //     }
    //     return {
    //         itemOptions,
    //         itemOptionData,
    //         itemImages,
    //     };
    // }

    async function getBrandTitle($) {
        let brand = ""; //$("h2.brand-title").text().trim();
        let title = `${brand} ${$("h1").text().trim()}`;
        return {
            brand,
            title,
        };
    }

    // async function getPrices($) {
    //     let salePrice = undefined;
    //     let numFormatter = new Intl.NumberFormat("en-US", {
    //         style: "currency",
    //         currency: "USD",
    //     });
    //     if (itemOptionData.length) {
    //         let prices = itemOptionData.map((item) => item.price);
    //         salePrice = Math.max(...prices);
    //         salePrice = numFormatter.format(salePrice);
    //     } else {
    //         salePrice = $("p.price ins").text();
    //         if (!salePrice) {
    //             salePrice = $("p.price bdi").text();
    //         }
    //     }

    //     let retailPrice = $("p.price > del > span > bdi").text();
    //     retailPrice = retailPrice ? retailPrice : salePrice;
    //     return { salePrice, retailPrice };
    // }

    async function getImages($) {
        let standardImage = $(
            "article[class='TPost movtv-info cont'] > div.Image > figure > img"
        ).attr("data-src");
        let otherImages = standardImage;

        return { standardImage, otherImages };
    }

    async function getDescription($) {
        let description = $(
            "article[class='TPost movtv-info cont'] div.Description p"
        ).html();
        return { description };
    }

    // async function getCategory($) {
    //     let categories = $("#topicPath span").toArray();
    //     categories = categories.map((item) => $(item).text().trim());
    //     categories = categories.join(" ");
    //     return { categories };
    // }

    // async function getItemCode(request) {
    //     let code = $("span.sku").text().trim();
    //     return { code };
    // }

    // async function getAvailability($, itemOptionData) {
    //     if (itemOptionData) {
    //         let prodAvailables = itemOptionData.filter(
    //             (item) => item.availability === true
    //         );
    //         if (prodAvailables.length > 1) {
    //             return "On Sale";
    //         } else {
    //             return "Sold out";
    //         }
    //     }else{
    //         return "On Sale"
    //     }
    // }

    /********************************************************************************/
    // let itemOptionData = await getItemOptionData($);
    let brandAndTitle = await getBrandTitle($);
    // let prices = await getPrices($);
    let images = await getImages($);
    let dsc = await getDescription($);
    // let categ = await getCategory($);
    // let itemCode = await getItemCode(request);
    // let availability = await getAvailability($, itemOptionData.itemOptionData);

    /********************************************************************************/
    let item = new ItemModel();
    item.ItemUrl = request.url;
    item.BrandName = brandAndTitle.brand;
    item.ItemTitle = brandAndTitle.title;
    // item.ItemRetailPrice = prices.retailPrice;
    // item.ItemPrice = prices.salePrice;
    // item.ItemStatus = itemOptionData.itemStatus;
    item.StandardImage = images.standardImage;
    item.OtherImages = images.otherImages;
    item.ItemDescription = dsc.description;
    // item.Category = categ.categories;
    // item.ItemOption = itemOptionData.itemOptions;
    // item.ItemOptionData = itemOptionData.itemOptionData;
    // item.ItemCode = itemCode.code;
    // item.ItemStatus = availability;
    // item.ItemModelNo = item.ItemCode
    Apify.pushData(item);
};
