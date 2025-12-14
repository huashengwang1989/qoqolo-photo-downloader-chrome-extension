module.exports = {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-scss'],
  rules: {
    'scss/dollar-variable-no-missing-interpolation': true, // catch missing variables
    'scss/dollar-variable-pattern': '^[a-z0-9\\-]+$', // enforce naming convention
  },
};
