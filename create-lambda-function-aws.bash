#!/bin/sh

# Configuration
REGION="us-east-1"
RUNTIME="nodejs18.x"
HANDLER="index.handler"
POLICY_ARN="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
OUTPUT_FILE="lambda-tools/lambda_urls.jsonl"
LOG_FILE="lambda-tools/aws_outputs.log"

# Function to log messages
log_message() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo "$message"
    echo "$message" >> "$LOG_FILE"
}

# Function to handle errors
handle_error() {
    log_message "ERROR: $1"
    exit 1
}

# Updated function to save AWS output without interrupting
save_and_confirm_output() {
    local command_name="$1"
    local output="$2"
    
    {
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Output from $command_name:"
        echo "$output"
        echo "------------------------"
    } >> "$LOG_FILE"

    # Optionally print a summary to console
    echo "Output from $command_name saved to $LOG_FILE"
}

# Function to create IAM role
create_iam_role() {
    role_name=$1
    log_message "Creating IAM role: $role_name"
    role_output=$(aws iam create-role \
        --role-name "$role_name" \
        --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
        2>&1)
    
    if [ $? -ne 0 ]; then
        handle_error "Failed to create IAM role: $role_output"
    fi
    
    save_and_confirm_output "create_iam_role" "$role_output"
    
    role_arn=$(echo "$role_output" | jq -r '.Role.Arn')
    echo "$role_arn"
}

# Function to attach policy to role
attach_role_policy() {
    role_name=$1
    log_message "Attaching policy to role: $role_name"
    policy_output=$(aws iam attach-role-policy \
        --role-name "$role_name" \
        --policy-arn "$POLICY_ARN" \
        2>&1)
    
    if [ $? -ne 0 ]; then
        handle_error "Failed to attach policy to role: $policy_output"
    fi
    
    save_and_confirm_output "attach_role_policy" "$policy_output"
}

# Function to create Lambda function
create_lambda_function() {
    function_name=$1
    role_arn=$2
    log_message "Creating Lambda function: $function_name"
    lambda_output=$(aws lambda create-function \
        --function-name "$function_name" \
        --runtime "$RUNTIME" \
        --role "$role_arn" \
        --handler "$HANDLER" \
        --zip-file fileb://lambda-tools/function.zip \
        --region "$REGION" \
        --timeout 30 \
        --memory-size 256 \
         2>&1)
    
    if [ $? -ne 0 ]; then
        handle_error "Failed to create Lambda function: $lambda_output"
    fi
    
    save_and_confirm_output "create_lambda_function" "$lambda_output"
}

# Function to create function URL config
create_function_url_config() {
    function_name=$1
    log_message "Creating function URL config for: $function_name"
    url_config_output=$(aws lambda create-function-url-config \
        --function-name "$function_name" \
        --auth-type NONE \
        --cors '{"AllowOrigins":["*"],"AllowMethods":["*"],"AllowHeaders":["date","keep-alive"]}' \
        --region "$REGION" \
        2>&1)
    
    if [ $? -ne 0 ]; then
        handle_error "Failed to create function URL config: $url_config_output"
    fi
    
    save_and_confirm_output "create_function_url_config" "$url_config_output"
}

# Function to add Lambda permission
add_lambda_permission() {
    function_name=$1
    log_message "Adding permission to Lambda function: $function_name"
    permission_output=$(aws lambda add-permission \
        --function-name "$function_name" \
        --statement-id FunctionURLAllowPublicAccess \
        --action lambda:InvokeFunctionUrl \
        --principal "*" \
        --function-url-auth-type NONE \
        --region "$REGION" \
        2>&1)
    
    if [ $? -ne 0 ]; then
        handle_error "Failed to add Lambda permission: $permission_output"
    fi
    
    save_and_confirm_output "add_lambda_permission" "$permission_output"
}

# Function to get and save function URL
get_and_save_function_url() {
    function_name=$1
    log_message "Getting and saving function URL for: $function_name"
    aws lambda get-function-url-config \
        --function-name "$function_name" \
        --region "$REGION" \
        | jq -c --arg name "$function_name" --arg region "$REGION" \
            '{name: $name, url: .FunctionUrl, region: $region}' \
        >> "$OUTPUT_FILE" \
        || handle_error "Failed to get or save function URL"
}

# Main function
main() {
    function_name="tts-$(date +%s)"
    role_name="lambda-basic-execution-$function_name"

    log_message "Starting Lambda function creation process"

    role_arn=$(create_iam_role "$role_name")
    role_arn=$(echo "$role_arn" | tr -d '\n' | sed 's/^.*arn:/arn:/')
    attach_role_policy "$role_name"

    log_message "Waiting for role propagation..."
    sleep 10

    create_lambda_function "$function_name" "$role_arn"
    create_function_url_config "$function_name"
    add_lambda_permission "$function_name"
    get_and_save_function_url "$function_name"

    log_message "Lambda function created and configured successfully"
}

# Run the main function
main
