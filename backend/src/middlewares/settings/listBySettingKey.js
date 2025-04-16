const Setting = require('../../models/coreModels/Setting');

const listBySettingKey = async ({ settingKeyArray = [] }) => {
  try {
    // Find document by id
    const settingsToShow = { $or: [] };

    if (settingKeyArray.length === 0) {
      return [];
    }

    for (const settingKey of settingKeyArray) {
      settingsToShow.$or.push({ settingKey });
    }
    let results = await Setting.find({ ...settingsToShow }).where('removed', false);

    // If no results found, return document not found
    if (results.length >= 1) {
      return results;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error in listBySettingKey:', error);
    return [];
  }
};

module.exports = listBySettingKey;
