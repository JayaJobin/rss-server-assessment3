import { FeedSource } from './FeedSource';
import { Author } from './Author';
import { Post } from './Post';
import { RequestLog } from './RequestLog';
import { FeedStatus } from './FeedStatus';

FeedSource.hasMany(Post, { foreignKey: 'feedSourceId', as: 'posts' });
Post.belongsTo(FeedSource, { foreignKey: 'feedSourceId', as: 'feedSource' });

Author.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(Author, { foreignKey: 'authorId', as: 'authorProfile' });

FeedSource.hasMany(RequestLog, { foreignKey: 'feedSourceId', as: 'requestLogs' });
RequestLog.belongsTo(FeedSource, { foreignKey: 'feedSourceId', as: 'feedSource' });

FeedSource.hasOne(FeedStatus, { foreignKey: 'feedSourceId', as: 'status' });
FeedStatus.belongsTo(FeedSource, { foreignKey: 'feedSourceId', as: 'feedSource' });
