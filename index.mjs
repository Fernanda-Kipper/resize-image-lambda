import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import sharp from 'sharp';

const client = new S3Client({ region: 'us-east-1' })

export const handler = async(event) => {
    try {
        resizeEachFile(event)
    } catch (error) {
        return {
            statusCode: 500,
            body: error.message,
        };
    }
 
    return {
        statusCode: 200,
        body: 'Image resized successfully',
    };
};

async function resizeEachFile(event){
    if(event?.Records && event.Records.length > 0) {
        for(const record of event.Records){
            const bucketName = record.s3.bucket.name;
            const objectKey = record.s3.object.key;

            try {
                let originObject = getObject(bucketName, objectKey);

                var stream = originObject.Body;
                if (stream instanceof Readable) {
                    var content_buffer = Buffer.concat(await stream.toArray());
                    const width = 200;
                
                    try {    
                    var output_buffer = await sharp(content_buffer).resize(width).toBuffer();
                
                    await putObject('thumbnails-output-file', objectKey, output_buffer, );
                
                    } catch (error) {
                        throw new Error('Error while uploading new object');
                    }
                } else {
                    throw new Error('Unknown object stream type');
                }

            } catch(e) {
                throw new Error('Error getting object from bucket');
            }
        }
    }
}

async function getObject(bucketName, objectKey){
    const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
    });

    try {
        const response = await client.send(getCommand);
        return response;
    } catch (error) {
        throw new Error('Error getting object from bucket');
    }
}

async function putObject(dstBucket, dstKey, content) {
    try {
        const putCommand = new PutObjectCommand({
          Bucket: dstBucket,
          Key: dstKey,
          Body: content,
          ContentType: "image"
        });
      
        const putResult = await client.send(putCommand);

        return putResult;
      
        } catch (error) {
          console.log(error);
          return;
        }
}
