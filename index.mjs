import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import sharp from 'sharp';

const client = new S3Client({ region: 'us-east-1' })

export const handler = async(event) => {

    if(event?.Records && event.Records.length > 0) {
        for(const record of event.Records){
            const bucketName = record.s3.bucket.name;
            const objectKey = record.s3.object.key;
        
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: objectKey
            });

            try {
                const response = await client.send(command);
                var stream = response.Body;
                if (stream instanceof Readable) {
                    var content_buffer = Buffer.concat(await stream.toArray());
                    const width  = 200;

                    try {    
                    var output_buffer = await sharp(content_buffer).resize(width).toBuffer();

                    await putObject('thumbnails-output-files', objectKey, output_buffer);

                    } catch (error) {
                        console.log(error);
                        return;
                    }
                } else {
                    throw new Error('Unknown object stream type');
                }

            } catch (error) {
                return {
                    statusCode: 500,
                    body: 'Error getting object from bucket',
                }
            }
        }
    }
 
    return {
        statusCode: 200,
        body: 'Image resized successfully',
    };
};

async function putObject(dstBucket, dstKey, content) {
    try {
        const destparams = {
          Bucket: dstBucket,
          Key: dstKey,
          Body: content,
          ContentType: "image"
        };
      
        const putResult = await client.send(new PutObjectCommand(destparams));

        return putResult;
      
        } catch (error) {
          console.log(error);
          return;
        }
}
