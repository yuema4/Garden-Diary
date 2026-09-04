export interface CustomApiConfig {
  apiKey: string;
  apiBase: string;
  apiModel: string;
  useAlternate: boolean;
}

export function getCustomApiConfig(): CustomApiConfig {
  const apiKey = localStorage.getItem('flora_custom_api_key') || '';
  const apiBase = localStorage.getItem('flora_custom_api_base') || '';
  const apiModel = localStorage.getItem('flora_custom_api_model') || '';
  const useAlternate = localStorage.getItem('flora_custom_use_alternate') === 'true';

  return {
    apiKey,
    apiBase,
    apiModel,
    useAlternate,
  };
}

export function saveCustomApiConfig(config: CustomApiConfig) {
  localStorage.setItem('flora_custom_api_key', config.apiKey);
  localStorage.setItem('flora_custom_api_base', config.apiBase);
  localStorage.setItem('flora_custom_api_model', config.apiModel);
  localStorage.setItem('flora_custom_use_alternate', config.useAlternate ? 'true' : 'false');
}

export function getCustomApiHeaders(): Record<string, string> {
  const config = getCustomApiConfig();
  if (!config.useAlternate || !config.apiKey.trim()) {
    return {};
  }
  return {
    'x-custom-api-key': config.apiKey.trim(),
    'x-custom-api-base': config.apiBase.trim(),
    'x-custom-api-model': config.apiModel.trim(),
    'x-custom-use-alternate': 'true',
  };
}
