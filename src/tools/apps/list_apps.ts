import { BaseTool } from '../base';
import { QuickbaseClient } from '../../client/quickbase';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ListAppsTool');

/**
 * Application information returned by list_apps
 */
export interface AppInfo {
  /**
   * The ID of the application
   */
  id: string;

  /**
   * The name of the application
   */
  name: string;

  /**
   * The description of the application
   */
  description?: string;

  /**
   * The date the application was created
   */
  created?: string;

  /**
   * The date the application was last updated
   */
  updated?: string;

  /**
   * Additional details about the application
   */
  [key: string]: any;
}

/**
 * Parameters for list_apps tool
 */
export interface ListAppsParams {
  /**
   * Whether to include archived applications in the results
   */
  include_archived?: boolean;

  /**
   * Filter applications by pattern (case-insensitive substring match on name or description)
   */
  filter?: string;
}

/**
 * Response from listing applications
 */
export interface ListAppsResult {
  /**
   * Array of application information
   */
  apps: AppInfo[];

  /**
   * Total number of applications (before filtering)
   */
  total?: number;
}

/**
 * Tool for listing Quickbase applications
 */
export class ListAppsTool extends BaseTool<ListAppsParams, ListAppsResult> {
  public name = 'list_apps';
  public description = 'Lists all Quickbase applications accessible to the user';

  /**
   * Parameter schema for list_apps
   */
  public paramSchema = {
    type: 'object',
    properties: {
      include_archived: {
        type: 'boolean',
        description: 'Whether to include archived applications'
      },
      filter: {
        type: 'string',
        description: 'Filter applications by name or description (case-insensitive substring match)'
      }
    },
    required: []
  };

  /**
   * Constructor
   * @param client Quickbase client
   */
  constructor(client: QuickbaseClient) {
    super(client);
  }

  /**
   * Run the list_apps tool
   * @param params Tool parameters
   * @returns List of applications
   */
  protected async run(params: ListAppsParams): Promise<ListAppsResult> {
    const { include_archived, filter } = params;

    logger.info('Listing Quickbase applications', {
      includeArchived: include_archived,
      filter
    });

    // Prepare query parameters
    const queryParams: Record<string, string> = {};

    if (include_archived !== undefined) {
      queryParams.includeArchived = include_archived.toString();
    }

    // List applications
    const response = await this.client.request({
      method: 'GET',
      path: '/apps',
      params: queryParams
    });

    if (!response.success || !response.data) {
      logger.error('Failed to list applications', {
        error: response.error
      });
      throw new Error(response.error?.message || 'Failed to list applications');
    }

    // Handle both array and wrapped object responses
    let appsData: any[];
    const responseData = response.data as any;

    if (Array.isArray(responseData)) {
      appsData = responseData;
    } else if (responseData.apps && Array.isArray(responseData.apps)) {
      appsData = responseData.apps;
    } else {
      logger.error('Unexpected response format', { responseData });
      throw new Error('Unexpected response format from API');
    }

    // Cast data to array of apps
    let apps: AppInfo[] = appsData.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description,
      created: app.created,
      updated: app.updated,
      ...app
    }));

    const totalBeforeFilter = apps.length;

    // Filter applications if requested
    if (filter && filter.trim() !== '') {
      const filterLower = filter.toLowerCase();
      apps = apps.filter(app =>
        app.name.toLowerCase().includes(filterLower) ||
        (app.description && app.description.toLowerCase().includes(filterLower))
      );
    }

    logger.info(`Found ${apps.length} applications (total before filtering: ${totalBeforeFilter})`);

    return {
      apps,
      total: totalBeforeFilter
    };
  }
}
