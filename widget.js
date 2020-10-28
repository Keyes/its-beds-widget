/* Licence: juliankern.com; CC BY 3.0 DE */
const apiUrlBase = 'https://intensiv-widget.juliankern.com/beds';
const getApiUrl = (location, state) => {
  if (location) { return `${apiUrlBase}?lat=${location.latitude.toFixed(3)}&lng=${location.longitude.toFixed(3)}`; }
  if (state) { return `${apiUrlBase}?state=${state}`; }
  return apiUrlBase;
}

const defaultCfg = {
  layout: 'simple',
};

const CONFIG = Object.assign({}, defaultCfg, arguments[0]);

init();

async function init() {
  const widget = await createWidget();
  if (!config.runsInWidget) await widget.presentSmall();

  Script.setWidget(widget);
  Script.complete();
}

async function createWidget(items) {
  const data = await getData();
  const list = new ListWidget();
  const header = list.addText("🛏 Freie ITS-Betten");
  header.font = Font.mediumSystemFont(12);

  if (data) {
    list.addSpacer();

    let weekData = { 
      overall: saveLoadData(data.overall, 'DE')
    };
    
    if (data.state) {
      weekData.state = saveLoadData(data.state, data.state.shortName);

      renderDatablock(list, data.state, weekData.state);
      
      list.addSpacer(4);
    }

    renderDatablock(list, data.overall, weekData.overall);

    list.refreshAfterDate = new Date(Date.now() + (1000 * 60 * 30));

    list.addSpacer(6);
    const dateFormatter = new DateFormatter();
    dateFormatter.useShortDateStyle();
    dateFormatter.useShortTimeStyle();

    const updated = list.addText(`↻ ${dateFormatter.string(new Date(data.overall.updated))}`);
    updated.font = Font.regularSystemFont(9);
    updated.textColor = Color.gray();
  } else {
    list.addSpacer();
    list.addText("Daten nicht verfügbar");
  }

  return list;
}

function renderDatablock(list, data, weekData) {
  const label = list.addText(`${data.used.toFixed(2)}% ${getBedsTrend(data, weekData)}`);
  label.font = Font.mediumSystemFont(22);
  label.textColor = getPercentageColor(data.used);

  const bedsLabel = list.addStack();
  bedsLabel.layoutHorizontally();
  bedsLabel.centerAlignContent();
  bedsLabel.useDefaultPadding();

  if (CONFIG.layout === 'extended') {
    const location = bedsLabel.addText((data.shortName || 'DE') + ' ');
    location.font = Font.semiboldSystemFont(10);
    location.textColor = Color.lightGray();

    const absoluteLabel = bedsLabel.addText(`${data.absolute.free}/${data.absolute.total}`);
    absoluteLabel.font = Font.mediumSystemFont(10);
    absoluteLabel.textColor = getPercentageColor(data.used);

    const relativeLabel = bedsLabel.addText(getBedsTrendAbsolute(data, weekData));
    relativeLabel.font = Font.mediumSystemFont(10);
    relativeLabel.textColor = Color.gray();
  } else {
    const location = bedsLabel.addText(data.name || 'Deutschland');
    location.font = Font.lightSystemFont(12);
  }
}

function getPercentageColor(value) {
  return value <= 25 ? Color.red() : value <= 50 ? Color.orange() : Color.green();
}

async function getData() {
  try {
    let foundData;
    
    if (args.widgetParameter) {
      foundData = await new Request(getApiUrl(null, args.widgetParameter)).loadJSON();
    } else {
      const location = await getLocation();
      foundData = await new Request(getApiUrl(location)).loadJSON();
    }

    return foundData;
  } catch (e) {
    return null;
  }
}

async function getLocation() {
  try {
    Location.setAccuracyToThreeKilometers();
    return await Location.current();
  } catch (e) {
    return null;
  }
}

function getBedsTrend(data, weekdata) {
  let bedsTrend = ' ';
  
  if (Object.keys(weekdata).length > 0) {
    const prevData = getDataForDate(weekdata);
  
    if (prevData) bedsTrend = (data.absolute.free === prevData.absolute.free) ? ' ' : ((data.absolute.free < prevData.absolute.free) ? '↓' : '↑');
  }
  
  return bedsTrend;
}

function getBedsTrendAbsolute(data, weekdata) {
  if (Object.keys(weekdata).length > 0) {
    const prevData = getDataForDate(weekdata);

    if (prevData) {
      const bedsTrend = (data.absolute.free - prevData.absolute.free);
      if (bedsTrend === 0) return '';
      if (bedsTrend > 0) bedsTrend = `+${bedsTrend}`;

      return ` (${bedsTrend})`;
    }
  }

  return '';
}

function getDataForDate(weekdata, yesterday = true, datestr = '') {
  let dateKey = datestr;
  let dayOffset = 1;
  const today = new Date();
  const todayDateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  if (typeof weekdata[todayDateKey] === 'undefined') dayOffset = 2;

  if (yesterday) {
    today.setDate(today.getDate() - dayOffset);
    dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  if (typeof weekdata[dateKey] !== 'undefined') return weekdata[dateKey];

  return false;
}

function saveLoadData(newData, suffix = '') {
  const updated = newData.updated.substr(0, 10);
  const loadedData = loadData(suffix);

  if (loadedData) {
    loadedData[updated] = newData;

    const loadedDataKeys = Object.keys(loadedData);
    const lastDaysKeys = loadedDataKeys.slice(Math.max(Object.keys(loadedData).length - 7, 0));

    let loadedDataLimited = {};
    lastDaysKeys.forEach(key => loadedDataLimited[key] = loadedData[key]);

    const { fm, path } = getFM(suffix);
    fm.writeString(path, JSON.stringify(loadedDataLimited))

    return loadedData;
  }

  return {};
}

function loadData(suffix) {
  const { fm, path } = getFM(suffix);

  if (fm.fileExists(path)) {
    const data = fm.readString(path);
    return JSON.parse(data);
  }

  return {};
}

function getFM(suffix) {
  let fm, path;

  try {
    fm = FileManager.iCloud();
    path = getFilePath(fm, suffix);
  } catch (e) {
    fm = FileManager.local();
    path = getFilePath(fm, suffix);
  }

  return { fm, path };
}

function getFilePath(fm, suffix) {
  return fm.joinPath(fm.documentsDirectory(), `its-beds-${suffix}.json`)
}
