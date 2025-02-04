import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { AssistantState } from '../slices/assistantSlice'
import { useContext } from 'react'
import { ExtensionContext } from '@looker/extension-sdk-react'
import process from 'process'

const connectionName =
  process.env.BIGQUERY_EXAMPLE_PROMPTS_CONNECTION_NAME || ''
const datasetName =
  process.env.BIGQUERY_EXAMPLE_PROMPTS_DATASET_NAME || 'explore_assistant'

export const useFeedback = () => {
  const { currentUser, currentExploreThread, isDevMode } = useSelector(
    (state: RootState) => state.assistant as AssistantState,
  )

  const { core40SDK } = useContext(ExtensionContext)

  const runSQLQuery = async (sql: string) => {
    const createSqlQuery = await core40SDK.ok(
      core40SDK.create_sql_query({
        connection_name: connectionName,
        sql: sql,
      }),
    )

    const { slug } = await createSqlQuery

    if (slug) {
      const runSQLQuery = await core40SDK.ok(
        core40SDK.run_sql_query(slug, 'txt'),
      )

      await runSQLQuery
    }
  }

  const sendUserFeedback = (isPositive: boolean, comment: string) => {
    const chatContextSqlArray = currentExploreThread!.messages
      .map(
        (item) =>
          `STRUCT(
            '${item.uuid}' as uuid,
            ${
              'message' in item && item.message
                ? `'${item.message}'`
                : 'CAST(NULL AS STRING)'
            } as message,
            '${item.actor}' as actor,
            ${item.createdAt} as createdAt,
            '${item.type}' as type,
            ${
              'exploreUrl' in item && item.exploreUrl
                ? `'${item.exploreUrl}'`
                : 'CAST(NULL AS STRING)'
            } as exploreUrl,
            ${
              'summarizedPrompt' in item && item.summarizedPrompt
                ? `'${item.summarizedPrompt}'`
                : 'CAST(NULL AS STRING)'
            } as summarizedPrompt
          )`,
      )
      .join(', ')

    const sql = `INSERT INTO \`${datasetName}.explore_assistant_feedback\`
                     (explore_id, created_at, user_email, first_name, last_name, is_positive, comment, chat_context, developer_mode)
                      VALUES (
                        '${currentExploreThread!.exploreKey}',
                        CURRENT_TIMESTAMP(),
                        '${currentUser!.email}',
                        '${currentUser!.first_name}',
                        '${currentUser!.last_name}',
                        ${isPositive},
                        ${comment ? `'${comment}'` : 'CAST(NULL AS STRING)'},
                        [${chatContextSqlArray}],
                        ${isDevMode}
                      )`

    return runSQLQuery(sql)
  }

  return { sendUserFeedback }
}
