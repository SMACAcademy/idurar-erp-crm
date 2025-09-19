const pug = require('pug');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
let pdf = require('html-pdf');
const { listAllSettings, loadSettings } = require('@/middlewares/settings');
const { getData } = require('@/middlewares/serverData');
const useLanguage = require('@/locale/useLanguage');
const { useMoney, useDate } = require('@/settings');

const pugFiles = ['invoice', 'offer', 'quote', 'payment'];

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A5', targetLocation: '' },
  result,
  callback
) => {
  try {
    const { targetLocation } = info;
    console.log(`[pdf] generatePdf start -> model=${modelName}, target=${targetLocation}`);

    // if PDF already exists, then delete it and create a new PDF
    if (fs.existsSync(targetLocation)) {
      fs.unlinkSync(targetLocation);
      console.log(`[pdf] removed existing file: ${targetLocation}`);
    }

    // ensure target directory exists
    const dir = path.dirname(targetLocation);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[pdf] created directory: ${dir}`);
    }

    // render pdf html
    if (pugFiles.includes(modelName.toLowerCase())) {
      console.log(`[pdf] loading settings...`);
      // Compile Pug template
      const settings = await loadSettings();
      console.log(`[pdf] settings loaded, language: ${settings['idurar_app_language']}`);
      const selectedLang = settings['idurar_app_language'];
      const translate = useLanguage({ selectedLang });

      const {
        currency_symbol,
        currency_position,
        decimal_sep,
        thousand_sep,
        cent_precision,
        zero_format,
      } = settings;

      const { moneyFormatter } = useMoney({
        settings: {
          currency_symbol,
          currency_position,
          decimal_sep,
          thousand_sep,
          cent_precision,
          zero_format,
        },
      });
      const { dateFormat } = useDate({ settings });

      settings.public_server_file = process.env.PUBLIC_SERVER_FILE;
      console.log(`[pdf] PUBLIC_SERVER_FILE: ${process.env.PUBLIC_SERVER_FILE}`);

      const htmlPath = 'src/pdf/' + modelName + '.pug';
      console.log(`[pdf] checking pug template: ${htmlPath}`);
      if (!fs.existsSync(htmlPath)) {
        console.error(`[pdf] pug template not found: ${htmlPath}`);
        const error = new Error(`Pug template not found: ${htmlPath}`);
        return callback ? callback(error) : (() => { throw error; })();
      }
      console.log(`[pdf] rendering pug template: ${htmlPath}`);
      const htmlContent = pug.renderFile(htmlPath, {
        model: result,
        settings,
        translate,
        dateFormat,
        moneyFormatter,
        moment: moment,
      });
      console.log(`[pdf] pug rendered, html length: ${htmlContent.length}`);

      console.log('[pdf] creating PDF via html-pdf...');
      pdf
        .create(htmlContent, {
          format: info.format,
          orientation: 'portrait',
          border: '10mm',
          // Stabilize PhantomJS on some systems
          timeout: 120000, // 120s
          localUrlAccess: true,
          phantomArgs: ['--local-url-access=true', '--web-security=false', '--ignore-ssl-errors=true'],
        })
        .toFile(targetLocation, function (error) {
          if (error) {
            console.error('[pdf] toFile error:', error);
            return callback
              ? callback(error)
              : (() => {
                  throw new Error(error);
                })();
          }
          console.log('[pdf] toFile success, checking file exists:', targetLocation);
          if (fs.existsSync(targetLocation)) {
            console.log('[pdf] file confirmed exists');
          } else {
            console.error('[pdf] file does not exist after creation');
          }
          if (callback) callback();
        });
    }
  } catch (error) {
    console.error('[pdf] generatePdf failed:', error);
    throw new Error(error);
  }
};
