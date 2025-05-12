import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import type { SupplierPlan } from '../types';

function extractSupplierDataFromHtml(html: string): SupplierPlan[] {
  const $ = cheerio.load(html);
  const allSupplierPlanData: SupplierPlan[] = [];

  const planTables = $('.tblCompareList');

  if (planTables.length === 0) {
    console.log("No supplier plan tables found with class '.tblCompareList'");
    return [];
  }

  const getElementText = (element: any): string | null => {
    return element.length > 0 ? element.text().trim() : null;
  };

  const extractValueAfterPrefix = (fullText: string | null, prefix: string): string | null => {
    if (fullText && fullText.startsWith(prefix)) {
      return fullText.substring(prefix.length).trim();
    }
    return fullText;
  };

  planTables.each((index, tableElement) => {
    const $table = $(tableElement);
    const plan: Partial<SupplierPlan> = {};

    plan.supplier_name = getElementText($table.find('.CompanyName b'));
    plan.plan_name = getElementText($table.find('.PlanName'));

    // KWh - using specific ID pattern (attribute starts with selector)
    const kwhElement = $table.find('span[id^="MainContent_CompareSupplierID_lblKWh_"]');
    plan.price_per_kwh = parseFloat(extractValueAfterPrefix(getElementText(kwhElement), "Per KWh: $") || '0');

    // Last Update - using specific ID pattern
    const lastUpdateElement = $table.find('span[id^="MainContent_CompareSupplierID_lblLastUpdate_"]');
    const lastUpdateStr = extractValueAfterPrefix(getElementText(lastUpdateElement), "Last Update:");
    plan.last_updated = lastUpdateStr ? new Date(lastUpdateStr) : undefined;

    const pricingElement = $table.find('.Pricing');
    plan.pricing_type = extractValueAfterPrefix(getElementText(pricingElement), "Pricing:");

    const monthlyChargeElement = $table.find('.MonthlyFee');
    const monthlyCharge = extractValueAfterPrefix(getElementText(monthlyChargeElement), "Monthly Charge:");
    plan.is_monthly_charge = monthlyCharge === 'Yes';

    const introPriceElement = $table.find('.IntroPrice');
    const introPrice = extractValueAfterPrefix(getElementText(introPriceElement), "Intro Price:");
    plan.is_intro_price = introPrice === 'Yes';

    const cancellationFeeElement = $table.find('.CancellationFee');
    const cancellationFee = extractValueAfterPrefix(getElementText(cancellationFeeElement), "Cancellation Fee:");
    plan.has_cancellation_fee = cancellationFee !== 'No';

    const renewableEnergyElement = $table.find('.RenewableEnergy');
    const renewableStr = extractValueAfterPrefix(getElementText(renewableEnergyElement), "Renewable Energy:") || '';
    const clean_renewable_str = renewableStr.replace(/\s+%/, '')
    if (clean_renewable_str) {
      plan.percent_renewable = parseFloat(clean_renewable_str) || 0;
    }

    const signUpLinkElement = $table.find('a[aria-label="Sign Up for Supplier Plan"]');
    if (signUpLinkElement.length > 0) {
      plan.link = signUpLinkElement.attr('href');
    } else {
      plan.link = null;
    }

    const rateGoodForElement = $table.find('.RateGoodFor');
    plan.rate_is_good_for = extractValueAfterPrefix(getElementText(rateGoodForElement), "Rate Good for:");

    const rateEndElement = $table.find('.RateEnd');
    plan.rate_end = extractValueAfterPrefix(getElementText(rateEndElement), "Rate End:");

    const commentsElement = $table.find('.Comments');
    if (commentsElement.length > 0) {
      let commentsText = getElementText(commentsElement);
      const commentsLabel = "Comments:";
      if (commentsText && commentsText.startsWith(commentsLabel)) {
        plan.comments = commentsText.substring(commentsLabel.length).trim().replace(/\s\s+/g, ' ');
      } else {
        plan.comments = commentsText ? commentsText.replace(/\s\s+/g, ' ') : undefined;
      }
    } else {
      plan.comments = undefined;
    }

    allSupplierPlanData.push(plan as SupplierPlan);
  });

  return allSupplierPlanData;
}

async function getSupplierInfo(): Promise<SupplierPlan[] | undefined> {
  try {
    console.log('Fetching supplier info...');
    const response = await axios.get('https://www.energy.nh.gov/engyapps/ceps/ResidentialCompare.aspx', {
      params: {
        choice: 'Eversource'
      },
      headers: {
        'User-Agent': 'Better NH Energy frontend',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Priority': 'u=0, i',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'TE': 'trailers'
      }
    });

    const htmlData: string = response.data;
    console.log('Successfully fetched HTML data.');

    const supplierData = extractSupplierDataFromHtml(htmlData);
    console.log(`Found ${supplierData.length} supplier plans.`);
    return supplierData;

  } catch (error: unknown) {
    console.error("Couldn't GET or parse supplier info");
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Axios Error:', axiosError.message);
      if (axiosError.response) {
        console.error('Status:', axiosError.response.status);
        console.error('Headers:', axiosError.response.headers);
        //console.error('Data:', axiosError.response.data);
      }
    } else if (error instanceof Error) {
      console.error('Generic Error:', error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    return undefined;
  }
}

// To run this and see the output:
async function main() {
  const supplierInfo = await getSupplierInfo();
  if (supplierInfo) {
    console.log(JSON.stringify(supplierInfo, null, 2));
  } else {
    console.log("Failed to retrieve supplier information.");
  }
}

export default getSupplierInfo;
