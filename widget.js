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
  if (CONFIG.debug) console.log('init called');
  const widget = await createWidget();
  if (!config.runsInWidget) await widget.presentSmall();

  Script.setWidget(widget);
  Script.complete();
}

async function createWidget(items) {
  if (CONFIG.debug) console.log('createWidget called');

  const data = await getData();
  const list = new ListWidget();
  // list.setPadding(20,-20,20,-20);

  if (CONFIG.debug) console.log('data received');

  // const header = list.addStack();
  // header.layoutHorizontally();
  // header.centerAlignContent();
  // header.setPadding(0,0,0,0);
  // header.spacing = 4;

  // const widgetIcon = SFSymbol.named('bed.double');
  // widgetIcon.applyFont(Font.mediumSystemFont(12));

  // const widgetIconImage = header.addImage(widgetIcon.image);
  // widgetIconImage.tintColor = Color.white();
  // widgetIconImage.imageSize = new Size(13, 13);
  // widgetIconImage.resizeable = false;

  const headerText = list.addText('Freie ITS-Betten');
  headerText.font = Font.mediumSystemFont(12);

  if (CONFIG.debug) console.log('base constructed');

  if (data) {
    list.addSpacer();

    let weekData = { 
      overall: saveLoadData(data.overall, 'DE')
    };
    
    if (data.state) {
      weekData.state = saveLoadData(data.state, data.state.shortName);

      if (CONFIG.debug) {
        console.log('render state datablock');
        console.log(data.state);
        console.log(weekData.state);
      }

      renderDatablock(list, data.state, weekData.state);
      
      list.addSpacer(4);
    }

    if (CONFIG.debug) {
      console.log('render overall datablock');
      console.log(data.overall);
      console.log(weekData.overall);
    }

    renderDatablock(list, data.overall, weekData.overall);

    list.refreshAfterDate = new Date(Date.now() + (1000 * 60 * 30));

    list.addSpacer(6);
    const dateFormatter = new DateFormatter();
    dateFormatter.useShortDateStyle();
    dateFormatter.useShortTimeStyle();

    // const updated = list.addStack();
    // updated.layoutHorizontally();
    // updated.centerAlignContent();
    // updated.setPadding(0,0,0,0);
    // updated.spacing = 2;

    // const updatedIcon = SFSymbol.named('arrow.clockwise');
    // updatedIcon.applyFont(Font.regularSystemFont(7));

    // const updatedIconImage = updated.addImage(updatedIcon.image);
    // updatedIconImage.tintColor = Color.gray();
    // updatedIconImage.imageSize = new Size(7, 7);
    // updatedIconImage.resizeable = false;

    const updatedLabel = list.addText(`↻ ${dateFormatter.string(new Date(data.overall.updated))}`);
    // const updatedLabel = updated.addText(`${dateFormatter.string(new Date(data.overall.updated))}`);
    updatedLabel.font = Font.regularSystemFont(9);
    updatedLabel.textColor = Color.gray();
  } else {
    list.addSpacer();
    list.addText("Daten nicht verfügbar");
  }

  return list;
}

function renderDatablock(list, data, weekData) {
  const percentLabel = list.addStack();
  percentLabel.layoutHorizontally();
  percentLabel.centerAlignContent();
  percentLabel.setPadding(0,0,0,0);
  percentLabel.spacing = 4;

  // const label = percentLabel.addText(`${data.used.toFixed(2)}% ${getBedsTrend(data, weekData)}`);
  const label = percentLabel.addText(`${data.used.toFixed(2)}%`);
  label.font = Font.mediumSystemFont(22);
  label.textColor = getPercentageColor(data.used);

  const trendIcon = SFSymbol.named(getBedsTrendIcon(data, weekData));
  trendIcon.applyFont(Font.regularSystemFont(15));

  const trendIconImage = percentLabel.addImage(trendIcon.image);
  trendIconImage.tintColor = getPercentageColor(data.used);
  trendIconImage.imageSize = new Size(12, 15);
  trendIconImage.resizeable = false;

  const bedsLabel = list.addStack();
  bedsLabel.layoutHorizontally();
  bedsLabel.centerAlignContent();
  bedsLabel.setPadding(0,0,0,0);
  bedsLabel.spacing = 2;


  if (CONFIG.layout === 'extended') {
    if (CONFIG.debug) console.log('render extended datablock');

    const location = bedsLabel.addText((data.shortName || 'DE'));
    location.font = Font.semiboldSystemFont(10);
    // location.textColor = Color.lightGray();

    const absoluteLabel = bedsLabel.addText(`${data.absolute.free}/${data.absolute.total}`);
    absoluteLabel.font = Font.mediumSystemFont(10);
    absoluteLabel.textColor = getPercentageColor(data.used);

    const relativeLabel = bedsLabel.addText(getBedsTrendAbsolute(data, weekData));
    relativeLabel.font = Font.mediumSystemFont(10);
    relativeLabel.textColor = Color.gray();
  } else {
    if (CONFIG.debug) console.log('render simple datablock');

    const location = bedsLabel.addText(data.name || 'Deutschland');
    location.font = Font.lightSystemFont(12);
  }
}

function getPercentageColor(value) {
  return value <= 25 ? Color.red() : value <= 50 ? Color.orange() : Color.green();
}

async function getData() {
  try {
    if (CONFIG.debug) console.log('try getting data');

    let foundData;
    
    if (args.widgetParameter) {
      foundData = await new Request(getApiUrl(null, args.widgetParameter)).loadJSON();
    } else {
      const location = await getLocation();
      foundData = await new Request(getApiUrl(location)).loadJSON();
    }

    return foundData;
  } catch (e) {
    if (CONFIG.debug) { 
      console.log('error getting data');
      console.log(e);
    }

    return null;
  }
}

async function getLocation() {
  try {
    if (CONFIG.debug) console.log('try getting location');

    Location.setAccuracyToThreeKilometers();
    return await Location.current();
  } catch (e) {
    if (CONFIG.debug) {
      console.log('error getting location');
      console.log(e);
    }

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

function getBedsTrendIcon(data, weekdata) {
  if (Object.keys(weekdata).length > 0) {
    const prevData = getDataForDate(weekdata);

    if (prevData) {
      if (data.absolute.free === prevData.absolute.free) return;
      if (data.absolute.free < prevData.absolute.free) return 'arrow.down';
      else return 'arrow.up';
    }
  }
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
